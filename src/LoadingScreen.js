class LoadingScreen{
    constructor(){
        this.tasks = {}
        this.scheduledToRemove = []

        this.removeTimeout = 500;

        this.textField = document.getElementById("loadingText");
        
    }
    addTask(name, value){
        // setTimeout((function(){
            this.tasks[name] = value;
            this._updateTextField()
            this._saveFromRemoval(name);
            // console.warn("ADD", name, value)
        // }).bind(this), 0);
    }
    removeTask(name){
        this.scheduledToRemove.push(name);
        setTimeout((function(){
            if(this.scheduledToRemove.includes(name)){
                // this.tasks[name] = null;
                this._updateTextField();
            }
        }).bind(this), this.removeTimeout);
        // console.warn("REMOVE", name)
    }
    updateTask(name, value){
        // setTimeout((function(){
            this.tasks[name] = value;
            this._updateTextField();
            this._saveFromRemoval(name);
            // console.warn("UPDATE", name, value)
        // }).bind(this), 0);
    }
    _updateTextField(){
        requestAnimationFrame((function(){
        let content = "";
        for (let task in this.tasks){
            if(this.tasks[task] != null){
                content+=task+": "+this.tasks[task]+"\n"
            }
        }
        this.textField.innerText = content;
        }).bind(this));
    }
    _saveFromRemoval(name){
        const dieIndex = this.scheduledToRemove.indexOf(name)
        if (dieIndex != -1){
            this.scheduledToRemove.pop(dieIndex);
        }
    }
    hide(){
        document.getElementById("loadingScreen").style.display = "none";
    }
}