class GenerationShader extends VolumeComputeShader{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl, volumeDimensions){
        super(gl);

        this.volumeDimensions = volumeDimensions;

        this.inputDepth = 1;
        this.outputDepth = 1;
        

        this.shaderSet = [
            {
                type: this._gl.VERTEX_SHADER,
                path: "shaders/baseVolume.vert",
                code: window.baseVolumeVertShader
            },
            {
                type: this._gl.FRAGMENT_SHADER,
                path: "shaders/gen.frag",
                code: window.genFragShader
            },
        ];

        this._createBuffers();

        this.workingTexture = this._add3DTexture("uWorkingSampler", 0, null, 1, true);
        // this.feedbackTexture = this._add3DTexture("uFeedbackSampler", 1, null, 1, false);
        this.dataTexture = this._add3DTexture("uDataSampler", 1, null, 1, false);

    }

    _addCustomUniforms(){
        this.uVoxelSize = this._gl.getUniformLocation(this.shader, "uVoxelSize");
        this._gl.uniform1i(this.uVoxelSize, 0);
        this.uBirthLimit = this._gl.getUniformLocation(this.shader, "uBirthLimit");
        this._gl.uniform1i(this.uBirthLimit, 0);
        this.uDeathLimit = this._gl.getUniformLocation(this.shader, "uDeathLimit");
        this._gl.uniform1i(this.uDeathLimit, 0);
    }

    loadOccupancyData(data){
        this.dataTexture.loadData(data);
        this.workingTexture.loadData(data);
    }

    copyOutputDataTo(data){
        data.set(this.workingTexture.textureData);
    }

    compute(params){
        this._gl.uniform1i(this.uVoxelSize, params.voxelSize);
        this._gl.uniform1i(this.uBirthLimit, params.birthLimit);
        this._gl.uniform1i(this.uDeathLimit, params.deathLimit);
    
        this.draw();
    }

    // _setDrawUniforms(params){
    //     this._gl.uniform1i(this.uVoxelSize, 0);
    //     this._gl.uniform1i(this.uBirthLimit, 0);
    //     this._gl.uniform1i(this.uDeathLimit, 0);
    // }
}