/**
 * @import {BABYLON} from 'babylonjs';
 */
class Drone extends BABYLON.TransformNode{
    constructor(scene) {
        super("Drone", scene);

        this.camera3rd = new Camera3rd("DroneCamera", scene);
        scene.activeCamera = this.camera3rd;
        this.camera3rd.attachControl(scene.getEngine().getRenderingCanvas(), false);
        this.camera3rd.lockedTarget = this;
        // this.camera3rd.targetOffset = new BABYLON.Vector3(0, 1, 0);
        this.camera3rd.cameraOffset = new BABYLON.Vector3(0, 0, -2);
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

        this.getWorldMatrix().copyFrom(new BABYLON.Matrix.Compose(this.scaling, BABYLON.Quaternion.FromEulerAngles(this.rotation), this.position));
    }
}