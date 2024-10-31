class WorkerPool {
  constructor(size, main, reqs) {
    this.size = size;
    this.workers = [];
    this.queue = [];

    this.onWorkerFinishCallback = ()=>{};
    this.onQueEmpty = ()=>{};

    this.buildPool(main, reqs);
  }
  buildWorkerCode(main, reqs) {
    let workerContent = main.toString();
    let workerArgs = (new RegExp("\\(.*\\)")).exec(workerContent)[0].slice(1, -1).split(',');
    // console.log(workerContent);
    for (let i = 0; i < workerArgs.length; i++) {
        workerArgs[i] = workerArgs[i].trim();
    }

    let mainBody = workerContent.slice(workerContent.indexOf('{')+1, workerContent.lastIndexOf('}'))

    let outputCode = '';
    outputCode += "onmessage = (e) => {\n"
    for (let i = 0; i < workerArgs.length; i++) {
        outputCode += `let ${workerArgs[i]} = e.data['${workerArgs[i]}'];\n`;
    }
    // mainBody = mainBody.replace(/return[ ]*(?<vals>.*);/g, "postMessage($1);");
    outputCode += mainBody;
    outputCode+="\n}\n";

    for (let i = 0; i < reqs.length; i++) {
        outputCode += '\n';
        let reqStr = reqs[i].toString();
        if(reqStr.indexOf('function') == -1 && reqStr.indexOf('class') == -1 ) {
            reqStr = "function " + reqStr;
        }
        outputCode += reqStr;
    }
    // workerContent = workerContent.replaceAll('\n', '');
    outputCode = outputCode.replaceAll('  ', '');
    outputCode = outputCode.replaceAll('\t', '');

    return outputCode;
  }
  buildPool(main, reqs) {
    const code = this.buildWorkerCode(main, reqs);
    // console.log(code);
    for (let i = 0; i < this.size; i++) {
        let url = URL.createObjectURL( new Blob( [ code ], { type: "text/javascript" } ) );
        const worker = new Worker(url);
        worker.isIdle = true;
        worker.onmessage = ((e) => {
            this._onWorkerMessage(worker, e.data);
        }).bind(this);
        this.workers.push(worker);
    }
  }

  _onWorkerMessage(worker, data) {
    worker.isIdle = true;
    this.onWorkerFinishCallback(data);
    if (this.queue.length) {
      const task = this.queue.shift();
      this._sendTaskToWorker(worker, task);
    }else if (this.workers.filter(worker => !worker.isIdle) == 0) {
        this.onQueEmpty();
    }
  }
  _sendTaskToWorker(worker, task) {
    worker.isIdle = false;
    worker.postMessage(task);
  }

  run(task) {
    const worker = this.workers.find(worker => worker.isIdle);
    if (worker) {
        this._sendTaskToWorker(worker, task);
    } else {
      this.queue.push(task);
    }
  }
}