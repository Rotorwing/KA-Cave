class VolumeComputeShader{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl){
        this._gl = gl;

        this.layerAttachmentBatchSize = 4;

        this.volumeDimensions = {x: 128, y: 128, z:16};
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

        this.inputTextures = [];
        this.outputTextures = [];
    }
    _createBuffers(){
        this._gl.canvas.width = this.volumeDimensions.x;
        this._gl.canvas.height = this.volumeDimensions.y;

        // this.texturesData = []

        this.outputTextureDataTemp = new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y *this.outputDepth);
        // this.outputTextureData = new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y *this.volumeDimensions.z * this.outputDepth);

        // this.vertexPositions = new Float32Array(this.volumeDimensions.x * this.volumeDimensions.y * this.attachments.length * 3);
        // this.vertexPositions = new Float32Array(this.volumeDimensions.x * this.volumeDimensions.y * this.volumeDimensions.z * 2);
        this.vertexPositions = new Float32Array(this.volumeDimensions.x * this.volumeDimensions.y * 2);

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
    // loadInputData(textureIndex, data, depth){
    //     let _depth = depth || this.inputDepth;
    //     let k = 0;
    //     for(let i = 0; i < data.length; i+=_depth){
    //         for(let j = 0; j < this.inputDepth; j++){
    //             let readIndex = i+Math.min(j, _depth-1);
    //             this.dataTextureData[k+j] = Math.min(Math.max(data[readIndex]*255, 0), 255);
    //         }
    //         k+=this.inputDepth;
    //     }

    //     if(this.dataTexture){
    //         this._gl.bindTexture(this._gl.TEXTURE_3D, this.dataTexture);
    //         this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.inputDepth),
    //             this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
    //             0, this._depthToType(this.inputDepth), this.inputType, this.dataTextureData);
    //     }
    // }

    _addCustomUniforms(){}
    _addCustomTextures(){}
    _onDrawEnd(){}

    _add3DTexture(uniformName, textureIndex, textureData, channels, isOutputTexture, createMipMap){
        const texture = new Texture3D(this._gl, this.shader, uniformName, textureIndex, this.volumeDimensions, channels, this._gl.NEAREST, textureData, createMipMap);
        if(isOutputTexture){
            this.outputTextures.push(texture);
        }else{
            this.inputTextures.push(texture);
        }
        return texture;
    }

/*
    _create3DTexture(textureName, textureIndex, textureData, shader){
        this.texturesData.push(new Uint8Array(this.volumeDimensions.x * this.volumeDimensions.y * this.volumeDimensions.z*this.inputDepth));

        this._gl.activeTexture(gl[`TEXTURE${textureIndex}`]);
        const uTexture = this._gl.getUniformLocation(shader, textureName);
        this._gl.uniform1i(uTexture, textureIndex);

        const texture = this._gl.createTexture(this._gl.TEXTURE_3D);
        this._gl.bindTexture(this._gl.TEXTURE_3D, texture);
        // // gl.uniform1i(uDataTexture, 0);
        

        this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.outputDepth),
            this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
            0, this._depthToType(this.outputDepth), this.outputType, textureData);

        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);

        this.textures.push(texture);
    }
*/

    shaderSetup(){
        console.log('Shader Setup:', this.shaderSet);
        this.shader = buildShaderProgram(this._gl, this.shaderSet, {"DATA_SIZE_X": this.volumeDimensions.x, "DATA_SIZE_Y": this.volumeDimensions.y, "DATA_SIZE_Z": this.volumeDimensions.z});

        this._gl.useProgram(this.shader);

        this.uDataSize = this._gl.getUniformLocation(this.shader, "dataSize");
        this._gl.uniform1i(this.uDataSize, this.volumeDimensions.x);//Math.max(this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z)/20);

        this.uZLayer = this._gl.getUniformLocation(this.shader, "zLayer");
        this._gl.uniform1i(this.uZLayer, 0);//Math.max(this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z)/20);

        for(let i = 0; i < this.inputTextures.length; i++){
            this.inputTextures[i].build(this.shader);
        }
        for(let i = 0; i < this.outputTextures.length; i++){
            this.outputTextures[i].build(this.shader);
        }

        this._addCustomUniforms();

        this._addCustomTextures();

        /* Working Texture */
        // this._create3DTexture("uWorkingSampler", 0, null, this.shader);
        // this._gl.activeTexture(gl.TEXTURE0);

        // this.workingTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        // this._gl.bindTexture(this._gl.TEXTURE_3D, this.workingTexture);
        // // // gl.uniform1i(uDataTexture, 0);
        

        // this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.outputDepth),
        //     this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
        //     0, this._depthToType(this.outputDepth), this.outputType, null);

        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE);


        /* Data Texture */
        // this._create3DTexture("uDataSampler", 1, this.dataTextureData, this.shader);
        // this._gl.activeTexture(gl.TEXTURE1);
        // const uDataTexture = this._gl.getUniformLocation(this.shader, "uDataSampler");
        // this._gl.uniform1i(uDataTexture, 1);

        // this.dataTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        // this._gl.bindTexture(this._gl.TEXTURE_3D, this.dataTexture);


        // this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.inputDepth),
        //                     this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
        //                     0, this._depthToType(this.inputDepth), this.inputType, this.dataTextureData);
        
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE);



        /* Feedback Texture */
        // this._create3DTexture("uFeedbackSampler", 3, this.outputTextureData, this.shader);
        // this._gl.activeTexture(gl.TEXTURE3);
        // const uFeedbackSampler = this._gl.getUniformLocation(this.shader, "uFeedbackSampler");
        // this._gl.uniform1i(uFeedbackSampler, 3);

        // this.feedbackTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        // this._gl.bindTexture(this._gl.TEXTURE_3D, this.feedbackTexture);

        // this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.outputDepth),
        //                     this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
        //                     0, this._depthToType(this.outputDepth), this.outputType, this.outputTextureData);
        
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        // this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE);


        // console.log('Feedback Texture Data:', this.outputTextureData);
        // console.log('Uniform Location:', uFeedbackSampler);

        // gl.generateMipmap(gl.TEXTURE_3D);



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
    _setDrawUniforms(){ }

    draw(){
        this._gl.viewport(0, 0, this.volumeDimensions.x, this.volumeDimensions.y);
        this._gl.useProgram(this.shader);

        // this._gl.activeTexture(gl.TEXTURE2);
        // this._gl.bindTexture(this._gl.TEXTURE_3D, this.feedbackTexture);

        // this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this._depthToInternalType(this.outputDepth),
        //     this.volumeDimensions.x, this.volumeDimensions.y, this.volumeDimensions.z,
        //     0, this._depthToType(this.outputDepth), this.outputType, this.outputTextureData);
        
        
        // this._gl.bindTexture(this._gl.TEXTURE_3D, null);

        this._setDrawUniforms();

        
        for (let j = 0; j < this.volumeDimensions.z; j += this.layerAttachmentBatchSize) {

            let currentAttachment = 0;
            let usedAttachments = [];
            let glAttachment = null;
            for(let texture of this.outputTextures){

                for(let i = 0; i < this.layerAttachmentBatchSize; i++){
                    glAttachment = this._gl[`COLOR_ATTACHMENT${currentAttachment}`];
                    this._gl.framebufferTextureLayer(this._gl.FRAMEBUFFER, glAttachment, texture.glTexture, 0, i+j); //+j

                    usedAttachments.push(glAttachment);
                    currentAttachment++;
                }

            }
            
            this._gl.uniform1i(this.uZLayer, j);
            this._gl.drawBuffers(usedAttachments);

            // this._gl.drawArrays(gl.POINTS, 0, 2);

            // if(startIndex+this.volumeDimensions.x*this.volumeDimensions.y > this.vertexPositions.length/4){
            //     console.log(startIndex, startIndex+this.volumeDimensions.x*this.volumeDimensions.y, this.vertexPositions.length, this.vertexPositions.length/3);
            // }

            this._gl.drawArrays(gl.POINTS, 0, this.volumeDimensions.x*this.volumeDimensions.y);//
            // this._gl.drawArrays(gl.POINTS, 0, 1);
            
            currentAttachment = 0;
            for(let texture of this.outputTextures){
                for(let i = 0; i < this.layerAttachmentBatchSize; i++){
                    this._gl.readBuffer(usedAttachments[currentAttachment]);
                    this._gl.readPixels(0, 0, texture.dimensions.x, texture.dimensions.y, texture.format, texture.dataType, this.outputTextureDataTemp);

                    // console.log('Output Texture Data Temp:', this.outputTextureDataTemp);
                    // console.log(texture.textureData.length, (i+j), texture.dimensions.x, texture.dimensions.y, texture.channels, this.outputTextureDataTemp.length);
                    texture.textureData.set(this.outputTextureDataTemp.subarray(0,texture.dimensions.x*texture.dimensions.y*texture.channels), (i+j)*texture.dimensions.x*texture.dimensions.y*texture.channels);
                    currentAttachment++;
                }
            }
        }

        this._onDrawEnd();
    }

}

class Texture3D{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl, shader, uniformName, glTextureIndex, dimensions, channels, glSamplingType, data, createMipMap){
        this._gl = gl;
        this.channels = channels;
        this.uniformName = uniformName;
        this.dimensions = dimensions;
        this.shader = shader;
        this.glTextureIndex = glTextureIndex;
        this.glSamplingType = glSamplingType;
        this.createMipMap = createMipMap;

        this.dataType = this._gl.UNSIGNED_BYTE;
        this.format = this._channelsToFormat(channels);
        this.internalFormat = this._channelsToInternalFormat(channels);

        this.textureData = new Uint8Array(this.dimensions.x * this.dimensions.y * this.dimensions.z*this.channels);
        if(data != null) this.loadData(data);

    }
    build(shader){
        let _shader = this.shader;
        if(shader != null){
            _shader = shader;
            this.shader = shader;
        }
        this._gl.useProgram(_shader);

        this._gl.activeTexture(gl[`TEXTURE${this.glTextureIndex}`]);
        this.glTextureUniform = this._gl.getUniformLocation(_shader, this.uniformName);
        this._gl.uniform1i(this.glTextureUniform, this.glTextureIndex);

        this.glTexture = this._gl.createTexture(this._gl.TEXTURE_3D);
        this._gl.bindTexture(this._gl.TEXTURE_3D, this.glTexture);
        // // gl.uniform1i(uDataTexture, 0);
        
        this.updateGlTexture();

        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MIN_FILTER, this.glSamplingType);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_MAG_FILTER, this.glSamplingType);


        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_3D, this._gl.TEXTURE_WRAP_R, this._gl.CLAMP_TO_EDGE);

        if(this.createMipMap){
            this._gl.generateMipmap(this._gl.TEXTURE_3D);
        }
    }
    loadData(data){
        // let k = 0;
        // for(let i = 0; i < data.length; i+=this.channels){
        //     for(let j = 0; j < this.channels; j++){
        //         let readIndex = i+Math.min(j, this.channels-1);
        //         this.textureData[k+j] = Math.min(Math.max(data[readIndex]*255, 0), 255);
        //     }
        //     k+=this.inputDepth;
        // }
        // this.textureData.set(data);
        for(let i = 0; i < data.length; i++){
            this.textureData[i] = Math.min(Math.max(data[i]*255, 0), 255);
        }

        if(this.glTexture != null) this.updateGlTexture();
    }
    updateGlTexture(){
        this._gl.bindTexture(this._gl.TEXTURE_3D, this.glTexture);


        this._gl.texImage3D(this._gl.TEXTURE_3D, 0, this.internalFormat,
            this.dimensions.x, this.dimensions.y, this.dimensions.z,
            0, this.format, this.dataType, this.textureData);
    }

    _channelsToFormat(channels){
        switch(channels){
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
    _channelsToInternalFormat(channels){
        switch(channels){
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
}