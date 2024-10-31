class VolumeComputeShader{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl){
        this._gl = gl;

        this.attachments = [
            this._gl.COLOR_ATTACHMENT0,
            this._gl.COLOR_ATTACHMENT1,
            this._gl.COLOR_ATTACHMENT2,
            this._gl.COLOR_ATTACHMENT3,
        ];

        this.volumeDimensions = {x: 16, y: 16, z:16};
        this.inputDepth = 4;
        this.outputDepth = 4;


        this.inputType = this._gl.UNSIGNED_BYTE;
        this.outputType = this._gl.UNSIGNED_BYTE;
        

        this.shaderSet = [
            {
                type: this._gl.VERTEX_SHADER,
                path: "shaders/baseVolume.vert",
            },
            {
                type: this._gl.FRAGMENT_SHADER,
                path: "shaders/baseVolume.frag",
            },
        ];

        
    }
    _createBuffers(){
        this._gl.canvas.width = this.volumeDimensions.x;
        this._gl.canvas.height = this.volumeDimensions.y;

        this.dataTextureData = new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y * this.volumeDimensions.z*this.inputDepth);

        this.outputTextureDataTemp = new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y *this.outputDepth);
        this.outputTextureData = new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y *this.volumeDimensions.z * this.outputDepth);

        // this.vertexPositions = new Float32Array(this.volumeDimensions.x * this.volumeDimensions.y * this.attachments.length * 3);
        this.vertexPositions = new Float32Array(this.volumeDimensions.x * this.volumeDimensions.y * this.volumeDimensions.z * 2);

        let index = 0;
        for(let x = 0; x <= this.volumeDimensions.x; x+=1){
            for(let y = 0; y <= this.volumeDimensions.y; y+=1){
                index = x*this.volumeDimensions.y + y;
                this.vertexPositions[index*2] = x;//(i*2+2)/this.volumeDimensions.x-1
                this.vertexPositions[index*2+1] = y;//(j*2+2)/this.volumeDimensions.y-1; //+1
                // this.vertexPositions[index*3+2] = z;//(k*2+2)/this.volumeDimensions.z-1;

                // this.vertexPositions[index*3+2] = 0;
                // this.vertexPositions[index*3] = i;
                // this.vertexPositions[index*3+1] = j;
                // this.vertexPositions[index*3+2] = k;
            }
        }
    }
    _depthToType(depth){
        switch(depth){
            case 1:
                return this._gl.RED;
            case 2:
                return this._gl.RG;
            case 3:
                return this._gl.RGB;
            case 4:
                return this._gl.RGBA;
            default:
                return this._gl.RGBA;
        }
    }
    _depthToInternalType(depth){
        switch(depth){
            case 1:
                return this._gl.R8;
            case 2:
                return this._gl.RG8;
            case 3:
                return this._gl.RGB8;
            case 4:
                return this._gl.RGBA8;
            default:
                return this._gl.RGBA8;

        }
    }
    loadInputData(data, depth){
        let _depth = depth || this.inputDepth;
        let k = 0;
        for(let i = 0; i < data.length; i+=_depth){
            for(let j = 0; j < this.inputDepth; j++){
                let readIndex = i+Math.min(j, _depth-1);
                this.dataTextureData[k+j] = Math.min(Math.max(data[readIndex]*255, 0), 255);
            }
            k+=this.inputDepth;
        }
    }

    shaderSetup(){
        this.shader = buildShaderProgram(this._gl, this.shaderSet, {"DATA_SIZE": this.volumeDimensions.x});

        this.uDataSize = this._gl.getUniformLocation(this.shader, "dataSize");
        this._gl.useProgram(this.shader);
        this._gl.uniform1i(this.uDataSize, this.volumeDimensions.x);//Math.max(this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z)/20);

        this.uZLayer = this._gl.getUniformLocation(this.shader, "zLayer");
        this._gl.useProgram(this.shader);
        this._gl.uniform1i(this.uZLayer, 0);//Math.max(this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z)/20);

        /* Data Texture */
        /*
        this._gl.activeTexture(gl.TEXTURE1);
        const uDataTexture = this._gl.getUniformLocation(this.shader, "uDataSampler");
        this._gl.uniform1i(uDataTexture, 1);

        this.dataTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        this._gl.bindTexture(this._gl.TEXTURE_3D, this.dataTexture);

        console.log("Input:", this._depthToInternalType(this.inputDepth), this._depthToType(this.inputDepth), this.inputType, this.dataTextureData);

        this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.inputDepth),
                            this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
                            0, this._depthToType(this.inputDepth), this.inputType, this.dataTextureData);
        
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        */


        /* Working Texture */
        /*
        this._gl.activeTexture(gl.TEXTURE0);
        this.workingTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        this._gl.bindTexture(this._gl.TEXTURE_3D, this.workingTexture);
        // // gl.uniform1i(uDataTexture, 0);
        
        console.log("Output:", this._depthToInternalType(this.outputDepth), this._depthToType(this.outputDepth), this.outputType, this.dataTextureData);

        this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.outputDepth),
            this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
            0, this._depthToType(this.outputDepth), this.outputType, null);

        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);


        this._gl.bindTexture(this._gl.TEXTURE_3D, null);
        */

        // this._gl.activeTexture(gl.TEXTURE0);
        this.workingTexture = this._gl.createTexture(this._gl.TEXTURE_2D);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.workingTexture);
        // // gl.uniform1i(uDataTexture, 0);
        
        console.log("Output:", this._depthToInternalType(this.outputDepth), this._depthToType(this.outputDepth), this.outputType, this.dataTextureData);

        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._depthToInternalType(this.outputDepth),
            this.volumeDimensions.x, this.volumeDimensions.y,
            0, this._depthToType(this.outputDepth), this.outputType, null);

        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);


        // this._gl.bindTexture(this._gl.TEXTURE_2D, null);
        
        // this._gl.activeTexture(gl.TEXTURE0);
        // this._gl.bindTexture(this._gl.TEXTURE_3D, null);

        

        // this._gl.bindTexture(this._gl.TEXTURE_3D, null);
        // this._gl.activeTexture(gl.TEXTURE1);

        this.glFramebuffer = this._gl.createFramebuffer();
        this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, this.glFramebuffer);


        this.glVertexBuffer = this._gl.createBuffer()
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.glVertexBuffer);
        this._gl.bufferData(this._gl.ARRAY_BUFFER, this.vertexPositions, this._gl.STATIC_DRAW);

        const aVertexPosition = this._gl.getAttribLocation(this.shader, "aPosition");
        this._gl.vertexAttribPointer(aVertexPosition, 2, this._gl.FLOAT, false, 0, 0); //this.attachments.length*this.volumeDimensions.z/4
        this._gl.enableVertexAttribArray(aVertexPosition);
        
        
        
    }

    draw(){
        this._gl.viewport(0, 0, this.volumeDimensions.x, this.volumeDimensions.y);
        this._gl.useProgram(this.shader);
        
        for (let j = 0; j < this.volumeDimensions.z; j += 4) {

            for(let i = 0; i < this.attachments.length; i++){
                this._gl.framebufferTexture2D(this._gl.FRAMEBUFFER, this.attachments[i], this.dataTexture, 0, i+j); //+j
            }
            
            this._gl.uniform1i(this.uZLayer, j);
            this._gl.drawBuffers(this.attachments);

            // this._gl.drawArrays(gl.POINTS, 0, 2);

            // if(startIndex+this.volumeDimensions.x*this.volumeDimensions.y > this.vertexPositions.length/4){
            //     console.log(startIndex, startIndex+this.volumeDimensions.x*this.volumeDimensions.y, this.vertexPositions.length, this.vertexPositions.length/3);
            // }

            this._gl.drawArrays(gl.POINTS, 0, this.volumeDimensions.x*this.volumeDimensions.y);//
            
            for(let i = 0; i < this.attachments.length; i++){
                this._gl.readBuffer(this.attachments[i]);
                this._gl.readPixels(0, 0, this.volumeDimensions.x, this.volumeDimensions.y, this._depthToType(this.outputDepth), this.outputType, this.outputTextureDataTemp);

                this.outputTextureData.set(this.outputTextureDataTemp, (i+j)*this.volumeDimensions.x*this.volumeDimensions.y*this.outputDepth);
            }
        }
        
    }
}