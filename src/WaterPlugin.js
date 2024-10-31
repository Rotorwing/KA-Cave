class WaterPlugin extends BABYLON.MaterialPluginBase {
    constructor(material, name, volumeDimensions, scaling) {
        super(material, name, 100, {});
        this._enable(true);
    }

    getCustomCode(shaderType){
        if(shaderType === "vertex"){
            return {
            }
        }else if(shaderType === "fragment"){
            return {
            }
        }
    }
}