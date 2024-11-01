/**
 * @import {BABYLON} from 'babylonjs';
 * @import {OBJFileLoader} from 'babylonjs';
 */
class Drone extends BABYLON.TransformNode{
    constructor(scene) {
        super("Drone", scene);

        this.camera3rd = new Camera3rd("DroneCamera", scene);
        scene.activeCamera = this.camera3rd;
        this.camera3rd.attachControl(scene.getEngine().getRenderingCanvas(), false);
        this.camera3rd.lockedTarget = this;
        // this.camera3rd.targetOffset = new BABYLON.Vector3(0, 1, 0);
        this.camera3rd.cameraOffset = new BABYLON.Vector3(0, 0, 0);
        this.camera3rd.cameraCollisionMeshes = [];
        this.camera3rd.radius = 5;
        this.camera3rd.fov = 1.1;

        this.camera3rd.attachTo(this);


        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.maxVelocity = new BABYLON.Vector3(0.1, 0.05, 0.1);
        this.drag = 0.9;

        this.angularVelocity = 0;
        this.maxAngularVelocity = 0.05;
        this.targetHeading = 0;

        this.mesh = BABYLON.MeshBuilder.CreateBox("DroneMesh", {size: 1}, scene);
        this.mesh.parent = this;
        this.mesh.receiveShadows = true;

        this.bodyMaterial = new BABYLON.StandardMaterial("DroneFrame", this.scene);
        this.bodyMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.42);
        this.bodyMaterial.roughness = 0.9;
        this.bodyMaterial.ambientColor = new BABYLON.Color3(0.6, 0.6, 0.6);

        // KhanImageLoader.LoadBase64Jpeg(window.Rock035_4KJPG_NormalGL, (function(texture){
        //     this.bodyMaterial.bumpTexture = texture
        this.bodyMaterial.giPlugin = new HDGIPlugin(this.bodyMaterial, "DroneFrameGIPlugin", window.game.cave.mapDimensions, window.game.cave.scaling, 4.5);
        // }).bind(this));
        
        this.rotorMaterial = new BABYLON.StandardMaterial("DroneRotor", this.scene);
        this.rotorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        this.rotorMaterial.alpha = 0.6;
        this.rotorMaterial.roughness = 0.2;
        this.rotorMaterial.ambientColor = new BABYLON.Color3(0.4, 0.4, 0.4);

        // BABYLON.appendSceneAsync(window.drone2Glb, scene, { pluginExtension: ".glb" }).then((function(e){
        // BABYLON.appendSceneAsync("/src/models/drone1.obj", scene, { pluginExtension: ".obj" }).then((function(e){
        
        BABYLON.appendSceneAsync(window.drone1Obj, scene, { pluginExtension: ".obj" }).then((function(e){
            this.mesh.dispose();
            this.mesh = this._scene.getNodeByName("DroneRoot");
            let rotors = this._scene.getNodeByName("DroneRotors");
            let rims = this._scene.getNodeByName("DroneRims");

            let headlight = new BABYLON.SpotLight("DroneLight", new BABYLON.Vector3(-0.8, -0.2, 0), new BABYLON.Vector3(-1,-0.3,0), Math.PI*0.5, 7, this.scene)
            headlight.intensity = 2;

            headlight.parent = this.mesh;
            this.mesh.material = this.bodyMaterial;
            rims.material = this.bodyMaterial;
            rotors.material = this.rotorMaterial;

            this.mesh.addChild(rotors);
            this.mesh.addChild(rims);
            this.mesh.parent = this;

            this.mesh.position.x = 0.65;

            this.mesh.receiveShadows = true;
            rims.receiveShadows = true;
            rotors.receiveShadows = true;

            this.onLoad();
        }).bind(this));
    }
    onLoad(){

    }

    setMouseValues(x, y) {
        this.camera3rd.setMouse(x, y);
        this.targetHeading = -this.camera3rd.gama;
    }

    control(force) {
        let _force = new BABYLON.Vector3();
        force.rotateByQuaternionToRef(new BABYLON.Quaternion.RotationAxis(BABYLON.Vector3.Up(), this.targetHeading-Math.PI/2), _force);
        // _force = force;
        this.velocity.addInPlace(_force);

        this.velocity.x = Math.min(Math.max(this.velocity.x, -this.maxVelocity.x), this.maxVelocity.x);
        this.velocity.y = Math.min(Math.max(this.velocity.y, -this.maxVelocity.y), this.maxVelocity.y);
        this.velocity.z = Math.min(Math.max(this.velocity.z, -this.maxVelocity.z), this.maxVelocity.z);
    }
    update() {
        this.camera3rd.update();
        this.position.addInPlace(this.velocity);
        // console.log(this.position)

        this.velocity.scaleInPlace(this.drag);

        this.angularVelocity = (this.targetHeading - this.rotation.y) * 0.5;
        this.angularVelocity = this.angularVelocity*this.angularVelocity*Math.sign(this.angularVelocity);
        this.angularVelocity = Math.min(Math.max(this.angularVelocity, -this.maxAngularVelocity), this.maxAngularVelocity);

        this.rotation.y += this.angularVelocity;

        this.applyWorldMatrix()
    }
    setPosition(position){
        this.position = position;
        this.applyWorldMatrix();

    }
    applyWorldMatrix(){
        this.getWorldMatrix().copyFrom(new BABYLON.Matrix.Compose(this.scaling, BABYLON.Quaternion.FromEulerAngles(this.rotation), this.position));
    }
}