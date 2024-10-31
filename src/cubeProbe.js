class CubeProbe{

    constructor(position, cubmapResolution, postProcesses, scene, nearClip, farClip){
        this._scene = scene;
        this.cubmapResolution = cubmapResolution;
        this.position = position;
        const positionName = `${position.x}.${position.y}.${position.z}`;


        // this._probe = new BABYLON.ReflectionProbe("cubemap-"+positionName, this.cubmapResolution, this._scene);
        // this._probe.position = this.position;
        // this.cubeTexture = this._probe.cubeTexture;
        
        // this.cubeTexture = new BABYLON.RenderTargetTexture("cubemap-"+positionName, this.cubmapResolution, this._scene, true, true, BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE, true);
        this.visualizer = BABYLON.MeshBuilder.CreateSphere("probe-"+positionName, { diameter: 1.0, segments:9}, this._scene);

        this.volumePosition = volumePosition

        this._target = new BABYLON.Vector3();
        this._add = new BABYLON.Vector3();
        this._viewMatrix = BABYLON.Matrix.Identity();

        this.nearClip = nearClip ?? 0.1,
        this.farClip = farClip ?? 100,

        this.cubeTexture.renderList = this._scene.meshes.filter((mesh) => !mesh.name.includes("probe"));
        this.cubeTexture.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        this.cubeTexture.refresh = true;

        this.visualizer.position = this.position;

        // PBRMaterial
        this.visualizer.PBRmaterial = new BABYLON.PBRMaterial("probeMatCM-"+positionName, this._scene);
        this.visualizer.PBRmaterial.backFaceCulling = true;
        this.visualizer.PBRmaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
        this.visualizer.PBRmaterial.roughness = 0.5;

        this.visualizer.PBRmaterial.disableLighting = true;
        this.visualizer.PBRmaterial.reflectionTexture = this.cubeTexture;


        // Default to PBRMaterial
        this.visualizer.material = this.visualizer.PBRmaterial;

        this.visualizer.visibility = false;

        this._scene.customRenderTargets.push(this.cubeTexture);

        for(postProcesses of postProcesses){
            this.cubeTexture.addPostProcess(postProcesses);
        }
        // probe.cubeTexture.addPostProcess(this.downSamplePostProcess);

        
        this.cubeTexture.onBeforeRenderObservable.add((faceIndex) => {
            // console.log(this)
            switch (faceIndex) {
                case 0:
                    this._add.copyFromFloats(1, 0, 0);
                    break;
                case 1:
                    this._add.copyFromFloats(-1, 0, 0);
                    break;
                case 2:
                    this._add.copyFromFloats(0, -1, 0);
                    break;
                case 3:
                    this._add.copyFromFloats(0, 1, 0);
                    break;
                case 4:
                    this._add.copyFromFloats(0, 0, 1);
                    break;
                case 5:
                    this._add.copyFromFloats(0, 0, -1);
                    break;
            }

            this.position.addToRef(this._add, this._target);

            BABYLON.Matrix.LookAtLHToRef(this.position, this._target, BABYLON.Vector3.Up(), this._viewMatrix);

            this._projectionMatrix = BABYLON.Matrix.PerspectiveFovLH(
                Math.PI / 2,
                1,
                this.nearClip,
                this.farClip,
                this._scene.getEngine().isNDCHalfZRange
            );
            scene.setTransformMatrix(this._viewMatrix, this._projectionMatrix);
            
            scene._forcedViewPosition = this.position;
        });
        
        this.cubeTexture.onAfterRenderObservable.add((e) =>{this.cubeTexture.refresh = false;});

        this.cubeTexture._shouldRender = function () {
            if (this.refresh){
                this.refresh = false;
                return true;
            }
            return false;
        }

    }

    recompute(){
        this.cubeTexture.refresh = true;
    }

    show(asGi){
        this.visualizer.visibility = true;
    }
    hide(){
        this.visualizer.visibility = false;
    }
}