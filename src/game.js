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

        this.settings = {
            scatteringEnabled: true,
            caveSize: 128,
            ssaoEnabled: true,
            fxaaEnabled: true,
            bloomEnabled: true,
            waterReflectionsEnabled: true
        }

        this.scene.clearColor = new BABYLON.Color3(0.9, 0.95, 1.0);
        this.scene.ambientColor = new BABYLON.Color3(0.27, 0.24, 0.22).scale(1.);

    }
    setup(){
        const caveSize = Math.min(this.settings.caveSize, gl.getParameter(gl.MAX_3D_TEXTURE_SIZE));
        this.caveDimensions = {x: caveSize, y: caveSize, z:64};
        this.cave = new GPUCaveGeneration(scene, gl, this.caveDimensions);
        this.giShader = new GIShader(gl, this.caveDimensions);

        this.createDrone();
        this.addLights();
        this.loadSceneGeometry();

        this.generateCaveVoxels();
        this.generateGi();
        this.generateCaveMesh();
        this.addRenderingPipeline();
    }
    createDrone(){
        this.drone = new Drone(scene);
        this.droneMoveVector = new BABYLON.Vector3(0, 0, 0);
        this.droneMoveSpeed = 0.01;
        this.drone.setPosition(new BABYLON.Vector3(20, 15, 20));

        if(this.settings.waterReflectionsEnabled){
            this.drone.onLoad = (function(){
                this.water.material.reflectionTexture.renderList.push(this.drone.mesh);
                this.water.material.reflectionTexture.renderList.push(...this.drone.mesh.getChildMeshes());
            }).bind(this)
        }
    }
    generateCaveVoxels(){
        this.cave.generate();
    }
    generateCaveMesh(){
        this.cave.createMarchingCubesMesh(this.oneCaveLoad.bind(this));

        this.cave.marchedMesh.scaling = this.cave.marchedMesh.scaling.scale(5);
        this.cave.marchedMesh.checkCollisions = true;
        this.sunShadowGenerator.addShadowCaster(this.cave.marchedMesh);
        this.cave.marchedMesh.receiveShadows = true;
        let shadowMat = new BABYLON.StandardMaterial("shadowMat", this.scene);
        shadowMat.backFaceCulling = false;
        this.sunShadowGenerator.getShadowMap().setMaterialForRendering(this.cave.marchedMesh, shadowMat);

    }
    generateGi(){
        this.giShader.loadOccupancyData(this.cave.occupancyMap);

        this.giShader.shaderSetup();
        this.giShader.draw();

        for(let i = 0; i < 2; i++){
            this.giShader.draw();
        }
        this.cave.setVoxelLighting(this.giShader.getOutputData());
    }
    generateScattering(){
        this.scattering = new Scattering(this.scene, this.drone.camera3rd, this.sun, this.sunShadowGenerator);
        this.scattering.addShadowMesh(this.cave.marchedMesh);
        this.scattering.calculateScattering();
    }
    oneCaveLoad(){
        this.refreshShadowMap();
        if(this.settings.scatteringEnabled) {
            this.generateScattering();
        }

        window.setupPointerLock();
    }
    createCamera(){
        this.camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 5, -10), this.scene);
        this.camera.attachControl(this.engine.getRenderingCanvas(), true);
        this.camera.maxZ = 500;
        this.camera.minZ = 0.5;
        this.camera.fov = 1;


        this.scene.collisionsEnabled = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new BABYLON.Vector3(1.0, 1.0, 1.0);
    }
    addLights(){
        const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0.8, 1.5, 0.25), this.scene);
        light.intensity = 0.1;
        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.8, -1.5, -0.25), this.scene);
        this.sun.position = this.sun.direction.scale(-50);
        this.sun.intensity = 3.5;
        // sun.shadowMinZ = 0.1;
        // sun.shadowMaxZ = 50;
        this.sun.autoCalcShadowZBounds = true;

        this.sunShadowGenerator = new BABYLON.ShadowGenerator(2048, this.sun);
        this.sunShadowGenerator.useCloseExponentialShadowMap = true;
        this.sunShadowGenerator.normalBias = 0.5
        this.sunShadowGenerator.usePoissonSampling = true;
        this.sunShadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        
    }
    addRenderingPipeline(){
        if(this.settings.ssaoEnabled){
            this.ssaoPipeline = new BABYLON.SSAORenderingPipeline("ssaopipeline", this.scene, 0.75, this.scene.activeCamera);
        }
        // if(this.settings.fxaaEnabled || this.settings.bloomEnabled){
            this.defaultPipeline = new BABYLON.DefaultRenderingPipeline("default", true, this.scene, [this.scene.activeCamera]);
            this.defaultPipeline.bloomEnabled = this.settings.bloomEnabled;
            this.defaultPipeline.fxaaEnabled = this.settings.fxaaEnabled;

            this.defaultPipeline.bloomWeight = 0.1;
            this.defaultPipeline.bloomKernel = 32;
            this.defaultPipeline.bloomThreshold = 0.92
            this.defaultPipeline.cameraFov = this.scene.activeCamera.fov;

            // this.defaultPipeline.imageProcessing.exposure = 0.5
            // this.defaultPipeline.imageProcessing.contrast = 0.9
            var curve = new BABYLON.ColorCurves();
            curve.midtonesExposure = -60;
            curve.shadowsExposure = -10;
            curve.highlightsExposure = 50;
            this.defaultPipeline.imageProcessing.colorCurvesEnabled = true;
            this.defaultPipeline.imageProcessing.colorCurves = curve;
            
        // }
    }

    loadSceneGeometry(){
        this.water = BABYLON.MeshBuilder.CreateGround("water", {width: 50, height: 50}, this.scene);
        this.water.position = new BABYLON.Vector3(40, 12.5, 40);
        this.water.receiveShadows = true;

        var waterMaterial = new BABYLON.StandardMaterial("water", this.scene);

        if(this.settings.waterReflectionsEnabled){
            waterMaterial.reflectionTexture = new BABYLON.MirrorTexture("water", 1024, this.scene, true);
            waterMaterial.reflectionTexture.mirrorPlane = BABYLON.Plane.FromPositionAndNormal(this.water.position, new BABYLON.Vector3.Down());
            waterMaterial.reflectionTexture.level = 0.9;
            waterMaterial.reflectionTexture.renderList.push(this.cave.marchedMesh);
            // waterMaterial.reflectionTexture.renderList.push(this.drone.mesh);
        }
        waterMaterial.diffuseColor = new BABYLON.Color3(10/255, 12/255, 12/255);
        waterMaterial.specularPower = 64;
        waterMaterial.alpha = 0.5


        this.water.material = waterMaterial;
    }
    refreshShadowMap(){
        this.sunShadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    }
    update(keys){
        this.water.position.x = scene.activeCamera.position.x;
        this.water.position.z = scene.activeCamera.position.z;

        this.moveDrone(keys);
        this.drone.update();
    }

    moveDrone(keys){
        this.droneMoveVector.set(0, 0, 0);
        if(keys["w"]){this.droneMoveVector.z += this.droneMoveSpeed;
        }if(keys["s"]){ this.droneMoveVector.z += -this.droneMoveSpeed;
        }if(keys["a"]){ this.droneMoveVector.x += -this.droneMoveSpeed;
        }if(keys["d"]){ this.droneMoveVector.x += this.droneMoveSpeed;
        }if(keys[" "]){ this.droneMoveVector.y += this.droneMoveSpeed;
        }if(keys["shift"]){ this.droneMoveVector.y += -this.droneMoveSpeed;
        }
        this.drone.control(this.droneMoveVector);
    }
}