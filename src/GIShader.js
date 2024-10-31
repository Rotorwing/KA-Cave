class GIShader extends VolumeComputeShader{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    constructor(gl, volumeDimensions){
        super(gl);

        this.volumeDimensions = volumeDimensions;

        this.inputDepth = 1;
        this.outputDepth = 4;
        

        this.shaderSet = [
            {
                type: this._gl.VERTEX_SHADER,
                path: "shaders/baseVolume.vert",
            },
            {
                type: this._gl.FRAGMENT_SHADER,
                path: "shaders/gi.frag",
            },
        ];
        this.iteration = 0;

        this.layerAttachmentBatchSize = 1;


        this._createBuffers();
        this.occupancyTexture = this._add3DTexture("uOccupancySampler", 0, null, 1, false, true);
        this.giOutputTextures = {
            "x+": this._add3DTexture("uXPSampler", 1, null, 4, true),
            "y+": this._add3DTexture("uYPSampler", 2, null, 4, true),
            "z+": this._add3DTexture("uZPSampler", 3, null, 4, true),
            "x-": this._add3DTexture("uXNSampler", 4, null, 4, true),
            "y-": this._add3DTexture("uYNSampler", 5, null, 4, true),
            "z-": this._add3DTexture("uZNSampler", 6, null, 4, true)
        }
        this.giFeedbackTextures = {
            "x+": this._add3DTexture("uXPFSampler", 7, null, 4, false),
            "y+": this._add3DTexture("uYPFSampler", 8, null, 4, false),
            "z+": this._add3DTexture("uZPFSampler", 9, null, 4, false),
            "x-": this._add3DTexture("uXNFSampler", 10, null, 4, false),
            "y-": this._add3DTexture("uYNFSampler", 11, null, 4, false),
            "z-": this._add3DTexture("uZNFSampler", 12, null, 4, false)
        }

    }
    loadOccupancyData(data){
        this.occupancyTexture.loadData(data);
    }

    getOutputData(){
        const data = []
        for(let key in this.giOutputTextures){
            data.push(this.giOutputTextures[key].textureData);
        }
        return data;
    }

    _addCustomUniforms(){
        this.uIteration = this._gl.getUniformLocation(this.shader, "uIteration");
        this._gl.uniform1i(this.uIteration, 0);
    }

    _setDrawUniforms(){
        this._gl.uniform1i(this.uIteration, this.iteration);
        this.iteration++;
    }
    _onDrawEnd(){
        for(let key in this.giOutputTextures){
            this.giFeedbackTextures[key].loadData(this.giOutputTextures[key].textureData);
        }
    }
}