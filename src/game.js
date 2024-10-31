/**
 * @import {BABYLON} from 'babylonjs';
 */
class Game{
    /**
     * 
     * @param {BABYLON.Scene} scene 
     * @param {BABYLON.Engine} engine 
     */
    constructor(scene, engine){
        this.scene = scene;
        this.engine = engine;
        this.loadScene();

        // this.camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 10, BABYLON.Vector3.Zero(), this.scene);
        // this.camera = new BABYLON.FlyCamera("FlyCamera", new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.attachControl(this.engine.getRenderingCanvas(), true);
        this.camera.maxZ = 500;
        this.camera.minZ = 0.5;
        this.scene.clearColor = new BABYLON.Color3(0.9, 0.95, 1.0);
        this.camera.fov = 1;


        this.scene.collisionsEnabled = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new BABYLON.Vector3(1.0, 1.0, 1.0);
        // this.camera.min = 0.1;
    }

    loadScene(){
        // Load your scene here
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0.8, 1.5, 0.25), this.scene);
        light.intensity = 0.1;
        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.8, -1.5, -0.25), this.scene);
        this.sun.position = this.sun.direction.scale(-50);
        this.sun.intensity = 3.5;
        // sun.shadowMinZ = 0.1;
        // sun.shadowMaxZ = 50;
        this.sun.autoCalcShadowZBounds = true;

        this.sunShadowGenerator = new BABYLON.ShadowGenerator(1024, this.sun);
        this.sunShadowGenerator.useCloseExponentialShadowMap = true;
        this.sunShadowGenerator.normalBias = 0.5
        this.sunShadowGenerator.usePoissonSampling = true;
        this.sunShadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        
        

        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, this.scene);
        this.sunShadowGenerator.addShadowCaster(sphere);
        sphere.position.y = 1;
        // const cube = BABYLON.MeshBuilder.CreateBox("box", {size: 1}, this.scene);
        // sphere.position.y = 1;
        this.water = BABYLON.MeshBuilder.CreateGround("ground", {width: 80, height: 80}, this.scene);
        this.water.position = new BABYLON.Vector3(40, 12.5, 40);
        // this.ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 50, height: 50}, this.scene);
        // this.ground.position = new BABYLON.Vector3(0, -1, 0);
        this.water.receiveShadows = true;

        var waterMaterial = new BABYLON.StandardMaterial("water", scene);
        waterMaterial.reflectionTexture = new BABYLON.MirrorTexture("water", 1024, scene, true);
		waterMaterial.reflectionTexture.mirrorPlane = BABYLON.Plane.FromPositionAndNormal(this.water.position, new BABYLON.Vector3.Down());
		waterMaterial.reflectionTexture.renderList = [sphere];
		waterMaterial.reflectionTexture.level = 0.9;
        waterMaterial.reflectionTexture.get
        waterMaterial.diffuseColor = new BABYLON.Color3(10/255, 12/255, 12/255);
        waterMaterial.specularPower = 64;
        waterMaterial.alpha = 0.5

        this.water.material = waterMaterial;
    }
}