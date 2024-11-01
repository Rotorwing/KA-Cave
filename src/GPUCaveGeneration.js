class GPUCaveGeneration{
    constructor(scene, gl, size){
        this.scene = scene;
        this.gl = gl;

        this.mapDimensions = size ?? {x: 128, y: 128, z:64};
        this.occupancyMap = new Float32Array(this.mapDimensions.x * this.mapDimensions.y*this.mapDimensions.z);

        this.genShader = new GenerationShader(gl, this.mapDimensions);
        this.genShader.shaderSetup();

        this.scaling = 0.1;
        
        this.voxelMesh = BABYLON.MeshBuilder.CreateBox("voxel", {size: this.scaling}, scene);
        // this.voxelMaterial = new BABYLON.StandardMaterial("voxelMaterial", scene);
        // this.voxelMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        // this.voxelMesh.material = this.voxelMaterial;

        // this.voxelMaterial.disableLighting = true;
        // this.voxelMesh.material.emissiveColor = BABYLON.Color3.White();

        BABYLON.Effect.ShadersStore["debugVoxelFragmentShader"] = window.debugVoxelFragmentShader;
        BABYLON.Effect.ShadersStore["debugVoxelVertexShader"] = window.debugVoxelVertexShader;
        
        this.voxelMaterial = new BABYLON.ShaderMaterial("shader", scene, "debugVoxel", {
            attributes: ["position", "normal", "cellPosition"],
            uniforms: ["world", "worldView", "viewProjection", "DATA_SIZE"],
            samplers: ["XPSampler", "YPSampler", "ZPSampler", "XNSampler", "YNSampler", "ZNSampler"]
        });
        this.voxelMaterial.setVector3("DATA_SIZE", new BABYLON.Vector3(this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z));

        let blankTex3D = () => new BABYLON.RawTexture3D(new Uint8Array(this.mapDimensions.x * this.mapDimensions.y*this.mapDimensions.z*4), this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z, BABYLON.Engine.TEXTUREFORMAT_RGBA, scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
        this.voxelMeshGITextureXP = blankTex3D();
        this.voxelMeshGITextureYP = blankTex3D();
        this.voxelMeshGITextureZP = blankTex3D();
        this.voxelMeshGITextureXN = blankTex3D();
        this.voxelMeshGITextureYN = blankTex3D();
        this.voxelMeshGITextureZN = blankTex3D();
        this.voxelMaterial.setTexture("XPSampler", this.voxelMeshGITextureXP);
        this.voxelMaterial.setTexture("YPSampler", this.voxelMeshGITextureYP);
        this.voxelMaterial.setTexture("ZPSampler", this.voxelMeshGITextureZP);
        this.voxelMaterial.setTexture("XNSampler", this.voxelMeshGITextureXN);
        this.voxelMaterial.setTexture("YNSampler", this.voxelMeshGITextureYN);
        this.voxelMaterial.setTexture("ZNSampler", this.voxelMeshGITextureZN);


        this.voxelMesh.material = this.voxelMaterial;

        


        this.marchedMesh = new BABYLON.Mesh("marchedMesh", scene);

        // this.marchedMeshMaterial = new BABYLON.ShaderMaterial("shader", scene, "./shaders/dynamicGiHd", {
        //     attributes: ["position", "normal"],
        //     uniforms: ["world", "worldView", "worldViewProjection", "viewProjection", "view", "DATA_SCALING"],
        //     samplers: ["XPSampler", "YPSampler", "ZPSampler", "XNSampler", "YNSampler", "ZNSampler"]
        // });

        // this.marchedMeshMaterial.setVector3("DATA_SCALING", new BABYLON.Vector3(1/(this.mapDimensions.x*this.scaling), 1/(this.mapDimensions.y*this.scaling), 1/(this.mapDimensions.z*this.scaling)));

        // this.marchedMeshMaterial.setTexture("XPSampler", this.voxelMeshGITextureXP);
        // this.marchedMeshMaterial.setTexture("YPSampler", this.voxelMeshGITextureYP);
        // this.marchedMeshMaterial.setTexture("ZPSampler", this.voxelMeshGITextureZP);
        // this.marchedMeshMaterial.setTexture("XNSampler", this.voxelMeshGITextureXN);
        // this.marchedMeshMaterial.setTexture("YNSampler", this.voxelMeshGITextureYN);
        // this.marchedMeshMaterial.setTexture("ZNSampler", this.voxelMeshGITextureZN);

        this.marchedMeshMaterial = new BABYLON.StandardMaterial("marchedMesh", scene);
        if(true){//window["KAInfiniteLoopProtect"]){
            // let dummy_data = new Uint8Array(4096*4096*3)
            // this.marchedMeshMaterial.bumpTexture = BABYLON.RawTexture.CreateRGBTexture(dummy_data, 4096, 4096);
            // this.marchedMeshMaterial.diffuseTexture = BABYLON.RawTexture.CreateRGBTexture(dummy_data, 4096, 4096);
            // this.marchedMeshMaterial.bumpTexture = new BABYLON.Texture("imgs/Rock035_4K-JPG_NormalGL.jpg", scene);
            // this.marchedMeshMaterial.diffuseTexture = new BABYLON.Texture("imgs/Rock035_4K-JPG_Color2.jpg", scene);
            // KhanImageLoader.LoadBase64Jpeg(window.testImg, (function(texture){this.marchedMeshMaterial.bumpTexture = texture}).bind(this)); //Rock035_4KJPG_NormalGL
            // KhanImageLoader.LoadBase64Jpeg(window.testImg, (function(texture){this.marchedMeshMaterial.diffuseTexture = texture}).bind(this)); //Rock035_4KJPG_Color2
            KhanImageLoader.LoadBase64Jpeg(window.Rock035_4KJPG_NormalGL, (function(texture){this.marchedMeshMaterial.bumpTexture = texture}).bind(this)); //Rock035_4KJPG_NormalGL
            KhanImageLoader.LoadBase64Jpeg(window.Rock035_4KJPG_Color2, (function(texture){this.marchedMeshMaterial.diffuseTexture = texture}).bind(this)); //Rock035_4KJPG_Color2
        }else{
            this.marchedMeshMaterial.bumpTexture = new BABYLON.Texture("imgs/Rock035_4K-JPG_NormalGL.jpg", scene);
            this.marchedMeshMaterial.diffuseTexture = new BABYLON.Texture("imgs/Rock035_4K-JPG_Color2.jpg", scene);
        }
        this.marchedMeshMaterial.roughness = 0.5;
        this.marchedMeshMaterial.giPlugin = new HDGIPlugin(this.marchedMeshMaterial, "marchedMeshGIPlugin", this.mapDimensions, this.scaling, 4.5);
        this.marchedMeshMaterial.triPlanerPlugin = new TriPlanerPlugin(this.marchedMeshMaterial, "marchedMeshTriPlanerPlugin");
        this.marchedMeshMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
        this.marchedMeshMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        this.marchedMeshMaterial.specularPower = 32;

        this.marchedMeshMaterial.backFaceCulling = true;

        this.marchedMesh.material = this.marchedMeshMaterial;

        this.simulateStep = (voxelSize, birthLimit, deathLimit, numberOfSteps) => {return {
            voxelSize: voxelSize,
            birthLimit: birthLimit,
            deathLimit: deathLimit,
            numberOfSteps: numberOfSteps,
            type: "simulateStep"
        }}
        this.randomizeStep = (voxelSize, chanceToRevive, chanceToKill, vDensityFalloff) => {return {
            voxelSize: voxelSize,
            chanceToRevive: chanceToRevive,
            chanceToKill: chanceToKill,
            vDensityFalloff: vDensityFalloff || 1.0,
            type: "randomizeStep"
        }}
        this.initStep = (voxelSize, chanceToStartAlive, vDensityFalloff) => {return {
            voxelSize: voxelSize,
            chanceToStartAlive: chanceToStartAlive,
            vDensityFalloff: vDensityFalloff || 1.0,
            type: "initStep"
        }}
        this.generationProperties = [
            // this.initStep(1, 0.9, 1.),
            // this.simulateStep(4, 9, 4, 1),

            this.initStep(12, 0.8, 0.4),
            this.randomizeStep(8, 0.5, 0.3, 0.5),
            this.randomizeStep(5, 0.2, 0.1, 0.6),
            this.simulateStep(4, 8, 7, 3),
            this.randomizeStep(1, 0.2, 0.35, 0.8),
            this.simulateStep(1, 9, 3, 3),
            this.simulateStep(1, 28, 3, 1),

            // this.simulateStep(1, 4, 3, 3),


        ];
    }

    getIndex(x, y, z){
        return z*this.mapDimensions.x*this.mapDimensions.y + y * this.mapDimensions.x + x;
    }

    writeOccupancy(position, value){
        const index = this.getIndex(position.x, position.y, position.z);
        this.occupancyMap[index] = value;
    }

    readOccupancy(position){
        const index = this.getIndex(position.x, position.y, position.z);
        return this.occupancyMap[index];
    }

    writeOccupancyVolume(volume, value){
        this._cubicIteration({w:volume.w || volume.s, h:volume.h || volume.s, d:volume.d || volume.s}, ({x, y, z}) => {
            if(volume.x+x >= this.mapDimensions.x || volume.y+y >= this.mapDimensions.y || volume.z+z >= this.mapDimensions.z){
                return;
            }
            this.writeOccupancy({x:volume.x+x, y:volume.y+y, z:volume.z+z}, value);
        });
    }

    

    _forEachCell(callback, stride){
        this._cubicIteration({w: this.mapDimensions.x, h: this.mapDimensions.y, d: this.mapDimensions.z, stride:stride || 1}, callback);
    }
    _cubicIteration({x, y, z, w, h, d, stride}, callback){
        x = x || 0;  y = y || 0; z = z || 0;
        for(let _x = 0; _x < w; _x+=stride || 1){
            for(let _y = 0; _y < h; _y+=stride || 1){
                for(let _z = 0; _z < d; _z+=stride || 1){
                    callback({x:x+_x, y:y+_y, z:z+_z});
                }
            }
        }
    }
    _generationStep(properties){
        switch(properties.type){
            case "simulateStep":
                this._generationSimulate(properties);
                break;
            case "randomizeStep":
                this._generationRandomness(properties);
                break;
            case "initStep":
                this._generationInit(properties);
                break;
        }
    }
    _generationInit(properties){
        console.log("Starting init step...");
        const voxelSize = properties.voxelSize
        let voxelState = false;
        this._forEachCell(({x, y, z}) => {

            voxelState = Math.random() < properties.chanceToStartAlive * this._falloffFunction(z, properties.vDensityFalloff);
            this.writeOccupancyVolume({x, y, z, s:voxelSize}, voxelState);
            
        }, voxelSize);
        console.log("Init step finished.");
    }
    _generationRandomness(properties){
        console.log("Starting randomness step...");
        let kill = false;
        let revive = false;
        this._forEachCell(({x, y, z}) => {

            revive = Math.random() < properties.chanceToRevive* this._falloffFunction(z, properties.vDensityFalloff);
            kill = Math.random() < properties.chanceToKill;
            if(revive || kill){
                this.writeOccupancyVolume({x, y, z, s:properties.voxelSize}, revive&&!kill);
            }
            
        }, properties.voxelSize);
        console.log("Randomness step finished.");
    }
    _falloffFunction(z, falloff){
        const center = this.mapDimensions.z*0.55;
        return Math.pow(falloff, Math.abs(z-center)/this.mapDimensions.z*10+1);
    }
    _generationSimulate(properties){
        window.loadingScreen.addTask("Simulation Step", "1");
        console.log("Starting simulation step...");
        for (let i = 0; i < properties.numberOfSteps; i++) {
            console.log(`Step ${i+1}/${properties.numberOfSteps}`);
            window.loadingScreen.updateTask("Simulation Step", `${i+1}/${properties.numberOfSteps}`);
            this.genShader.loadOccupancyData(this.occupancyMap);
            this.genShader.compute(properties);
            this.genShader.copyOutputDataTo(this.occupancyMap);
        }
        console.log("Simulation step finished.");
        window.loadingScreen.removeTask("Simulation Step");
    }
    generate(){
        window.loadingScreen.addTask("Generation Phase", "started");
        for(let i = 0; i < this.generationProperties.length; i++){
            window.loadingScreen.updateTask("Generation Phase", "("+i+") "+this.generationProperties[i].type);
            this._generationStep(this.generationProperties[i]);
        }
        for(let i = 0; i < this.occupancyMap.length; i++){
            this.occupancyMap[i] = 255-this.occupancyMap[i];
        }
        window.loadingScreen.removeTask("Generation Phase");
        
    }
    createInstances(giLighting){
        // const m = BABYLON.Matrix.Identity();
        let bufferIndex = 0;

        let matricesArray = [];
        let lightingArray = [];
        let cellPositionArray =[];

        // convert giLighting to float 32 (/255)
        let giLightingFloat32 = new Float32Array(giLighting.length);
        for (let i = 0; i < giLighting.length; i++) {
            giLightingFloat32[i] = giLighting[i] / 255;

            // giLightingFloat32[i] = this.genShader.outputTextureData[Math.floor(i/4)] / 255;
        }
        // let color = new Float32Array(16 * instanceCount);

        this._forEachCell(({x, y, z}) => {
            if(this.readOccupancy({x, y, z})){
                const matrix = BABYLON.Matrix.Translation(x*this.scaling, z*this.scaling, y*this.scaling); //this.transform.multiply(BABYLON.Matrix.Translation(x*this.scaling, z*this.scaling, y*this.scaling));
                // matrix.copyToArray(matricesData, 16 * (bufferIndex));
                matricesArray.push(...matrix.asArray());

                let index = this.getIndex(x, y, z);
                // lightingData[bufferIndex*4] = giLightingFloat32[index*4];
                // lightingData[bufferIndex*4+1] = giLightingFloat32[index*4+1];
                // lightingData[bufferIndex*4+2] = giLightingFloat32[index*4+2];
                // lightingData[bufferIndex*4+3] = giLightingFloat32[index*4+3];
                lightingArray.push( giLightingFloat32[index*4],
                                    giLightingFloat32[index*4+1],
                                    giLightingFloat32[index*4+2],
                                    giLightingFloat32[index*4+3]);

                // cellPositionData[bufferIndex*3] = x;
                // cellPositionData[bufferIndex*3+1] = y;
                // cellPositionData[bufferIndex*3+2] = z;
                cellPositionArray.push(x, y, z);

                // let value = this.genShader.outputTextureData[index]/255;
                // lightingData[bufferIndex*4] = value;
                // lightingData[bufferIndex*4+1] = value;
                // lightingData[bufferIndex*4+2] = value;
                // lightingData[bufferIndex*4+3] = value;
                // bufferIndex++;
                bufferIndex++;
            }

        });
        let matricesData = new Float32Array(matricesArray);
        let lightingData = new Float32Array(lightingArray);
        let cellPositionData = new Float32Array(cellPositionArray);

        // console.log(matricesData);
        // console.log(lightingData);
        // console.log(cellPositionData);

        this.voxelMesh.thinInstanceSetBuffer("color", lightingData, 4);
        this.voxelMesh.thinInstanceSetBuffer("cellPosition", cellPositionData, 3);
        this.voxelMesh.thinInstanceSetBuffer("matrix", matricesData, 16);
    }

    setVoxelLighting(giLighting){
        this.voxelMeshGITextureXP.update(giLighting[0]);
        this.voxelMeshGITextureYP.update(giLighting[1]);
        this.voxelMeshGITextureZP.update(giLighting[2]);
        this.voxelMeshGITextureXN.update(giLighting[3]);
        this.voxelMeshGITextureYN.update(giLighting[4]);
        this.voxelMeshGITextureZN.update(giLighting[5]);

        this.marchedMeshMaterial.giPlugin.setGiTextureData(giLighting);
    };

    createMarchingCubesMesh(callback){
        // const data = MarchingCubes.generateMesh(this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z, (x, y, z) => this.readOccupancy({x, y, z}), this.scaling);
        MarchingCubes.generateMeshWithWorkers(this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z, (x, y, z) => {return this.readOccupancy({x, y, z})/255}, this.scaling, ((data) => {

            data = MarchingCubes.optimizeMesh(data);
            const normals = [];


            console.log(data);
            BABYLON.VertexData.ComputeNormals(data.vertices, data.indices, normals);

            const vertexData = new BABYLON.VertexData();
            
            vertexData.positions = data.vertices;
            vertexData.indices = data.indices;
            vertexData.normals = normals;

            vertexData.applyToMesh(this.marchedMesh);

            // this.marchedMesh.convertToFlatShadedMesh();

            var mat = new BABYLON.StandardMaterial("", scene);
            mat.backFaceCulling=false;
            mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            // this.marchedMesh.material = mat;
            this.marchedMesh.material = this.marchedMeshMaterial;

            if(callback){
                callback();
            }

            // this.marchedMesh.position.x = -1;
        }).bind(this));
    }
}