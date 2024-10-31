class Camera3rd extends BABYLON.FreeCamera{
    constructor(name, scene){
        const target = new BABYLON.TransformNode("target", scene);
        super(name, target.position.clone(), scene);

        this.lockedTarget = target;

        this.targetMesh = null;

        this.minZ = 0.1;
        this.maxZ = 1000;
        this._position.y = 1;
        this._position.x = 8;

        this.fov = 1.2;
        this.theta = 0;
        this.gama = 0;

        this.radius = 8;
        this.minRadius = 0.5;
        this.maxRadius = 8;

        this.cameraOffset = new BABYLON.Vector3(0, 0, 0);
        this.targetOffset = new BABYLON.Vector3(0, 0, 0);

        this.cameraCollisionMeshes = [];

        this.targetWorld = null;
    }

    update(){
        if(this.targetMesh){
            const fixedTargetWorld = new BABYLON.Vector3.FromArray(this.targetMesh.getWorldMatrix().asArray().slice(12, 15)).add(this.targetOffset);
            if (this.targetWorld != null){
                this.targetWorld = BABYLON.Vector3.Lerp(this.targetWorld, fixedTargetWorld, 0.85);
            }
            this.targetWorld = fixedTargetWorld;
            // console.log("targetWorld", targetWorld, "offset", this.targetOffset, "total", targetWorld.add(this.targetOffset));
            this.lockedTarget.position = this.targetWorld;
            const toTarget = BABYLON.Vector3.Normalize(this.position.subtract(this.targetWorld));
            const directionRay = new BABYLON.Vector3(Math.cos(this.gama)*Math.cos(this.theta), Math.sin(this.theta), Math.sin(this.gama)*Math.cos(this.theta));
            const upRay = new BABYLON.Vector3(Math.cos(this.gama)*Math.cos(this.theta + Math.PI/2), Math.sin(this.theta + Math.PI/2), Math.sin(this.gama)*Math.cos(this.theta + Math.PI/2));
            const rightRay = BABYLON.Vector3.Cross(upRay, directionRay);

            const rayCast = new BABYLON.Ray(this.targetWorld, directionRay);
            const sceneMeshes = this.cameraCollisionMeshes;
            const rayHit = this._scene.pickWithRay(rayCast, (mesh)=>{return sceneMeshes.includes(mesh)});
            if(rayHit.hit){
                this.radius = Math.max(Math.min(rayHit.distance, this.maxRadius), this.minRadius);
            }else{
                this.radius = this.maxRadius;
            }
            const worldOffset = directionRay.scale(this.cameraOffset.z).add(upRay.scale(this.cameraOffset.y)).add(rightRay.scale(this.cameraOffset.x));

            this._position.copyFrom( directionRay.scale(this.radius).add(this.targetWorld).add(worldOffset));
            // this.position = targetWorld.add(new BABYLON.Vector3(5, 5, 5));
            // this.position.copyFrom(new BABYLON.Vector3(15, 15, 15));
        }
        super.update();
        // this._position
    }

    attachTo(mesh){
        this.targetMesh = mesh;
    }

    setMouse(x, y){
        // this.theta = this._scene.activeCamera.fov/2 - y/this._scene.getEngine().getRenderHeight()*this._scene.activeCamera.fov;
        // this.gama = x/this._scene.getEngine().getRenderWidth()*this._scene.activeCamera.fov - this._scene.activeCamera.fov/2;

        this.theta = y/this._scene.getEngine().getRenderHeight();
        this.gama = x/this._scene.getEngine().getRenderHeight();
    }
}