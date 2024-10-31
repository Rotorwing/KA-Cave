class Cavegen{
    constructor(scene){
        this.scene = scene;

        this.mapDimensions = {x: 32, y: 32, z:32};
        this.occupancyMap = new Float32Array(this.mapDimensions.x * this.mapDimensions.y*this.mapDimensions.z);

        this.scaling = 0.1;
        this.transform = new BABYLON.Matrix.Translation(this.mapDimensions.x*this.scaling/2, this.mapDimensions.z*this.scaling/2, this.mapDimensions.y*this.scaling/2);

        this.voxelMesh = BABYLON.MeshBuilder.CreateBox("voxel", {size: this.scaling}, scene);
        this.voxelMaterial = new BABYLON.StandardMaterial("voxelMaterial", scene);
        this.voxelMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        this.voxelMesh.material = this.voxelMaterial;

        // this.voxelMesh.material.disableLighting = true;
        // this.voxelMesh.material.emissiveColor = BABYLON.Color3.White();

        this.instances = [];

        this.marchedMesh = new BABYLON.Mesh("marchedMesh", scene);
        
        this.generationProperties = [
            {
                voxelSize: 3,
                birthLimit: 9, //10
                deathLimit: 8, // 6
                numberOfSteps: 3, //2
                chanceToStartAlive: 0.25
            },
            // {
            //     voxelSize: 1,
            //     chanceToRevive: 0.25,
            //     chanceToKill: 0.3,
            // },
            // {
            //     voxelSize: 1,
            //     birthLimit: 9,
            //     deathLimit: 6,
            //     numberOfSteps: 2, //2
            //     chanceToStartAlive: 0.3,
            // }
        ];
        this.generationStep = 0;

        this.simulationPool = new WorkerPool(16, this._simulationWorkerStep, [this.getIndex, this._cubicIteration, this._simulationLogic]);
        this.simulationPool.onWorkerFinishCallback = this._simulationWorkerResponse.bind(this);
        this.simulationPool.onQueEmpty = this._nextGenerationStep.bind(this);
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

    createInstances(giLighting){
        // const m = BABYLON.Matrix.Identity();
        const instanceCount = this.mapDimensions.x * this.mapDimensions.y * this.mapDimensions.z;
        let matricesData = new Float32Array(16 * instanceCount);
        let lightingData = new Float32Array(4 * instanceCount);
        let bufferIndex = 0;
        // convert giLighting to float 32 (/255)
        console.log(giLighting.length, instanceCount*4);
        let giLightingFloat32 = new Float32Array(giLighting.length);
        for (let i = 0; i < giLighting.length; i++) {
            giLightingFloat32[i] = giLighting[i] / 255;
        }
        // let color = new Float32Array(16 * instanceCount);

        this._forEachCell(({x, y, z}) => {
            if(this.readOccupancy({x, y, z})){
                const matrix = BABYLON.Matrix.Translation(x*this.scaling, z*this.scaling, y*this.scaling) //this.transform.multiply(BABYLON.Matrix.Translation(x*this.scaling, z*this.scaling, y*this.scaling));
                matrix.copyToArray(matricesData, 16 * (bufferIndex));

                let index = this.getIndex(x, y, z);
                lightingData[bufferIndex*4] = giLightingFloat32[index*4];
                lightingData[bufferIndex*4+1] = giLightingFloat32[index*4+1];
                lightingData[bufferIndex*4+2] = giLightingFloat32[index*4+2];
                lightingData[bufferIndex*4+3] = giLightingFloat32[index*4+3];
                bufferIndex++;
            }

        });
        this.voxelMesh.thinInstanceSetBuffer("color", lightingData, 4);
        this.voxelMesh.thinInstanceSetBuffer("matrix", matricesData, 16);
    }
    _forEachCell(callback, stride){
        this._cubicIteration({w: this.mapDimensions.x, h: this.mapDimensions.y, d: this.mapDimensions.z, stride:stride || 1}, callback);
    }
    _randomGeneration(properties){
        const voxelSize = properties.voxelSize
        let voxelState = false;
        this._forEachCell(({x, y, z}) => {

            voxelState = Math.random() < properties.chanceToStartAlive;
            this.writeOccupancyVolume({x, y, z, s:voxelSize}, voxelState);
            
        }, voxelSize);
    }
    _addRandomness(properties){
        let kill = false;
        let revive = false;
        this._forEachCell(({x, y, z}) => {

            revive = Math.random() < properties.chanceToRevive;
            kill = Math.random() < properties.chanceToKill;
            if(revive || kill){
                this.writeOccupancyVolume({x, y, z, s:properties.voxelSize}, revive&&!kill);
            }
            
        }, properties.voxelSize);
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
    _simulationStep(properties){
        const chunkSize = 8;
        for(let x = 0; x < this.mapDimensions.x; x+=chunkSize){
            for(let y = 0; y < this.mapDimensions.y; y+=chunkSize){
                for(let z = 0; z < this.mapDimensions.z; z+=chunkSize){
                    this.simulationPool.run({properties, map:this.occupancyMap, chunk:{x, y, z,
                        w:Math.min(this.mapDimensions.x, chunkSize+x)-x,
                        h:Math.min(this.mapDimensions.y, chunkSize+y)-y,
                        d:Math.min(this.mapDimensions.z, chunkSize+z)-z}, mapDimensions:this.mapDimensions});
                }
            }
        }

    }
    _simulationWorkerResponse(data){
        const {chunk, map} = data;
        // console.log("Worker response", chunk, map);
        this._cubicIteration(chunk, ({x, y, z}) => {
            this.writeOccupancy({x, y, z}, this.readOccupancy({x, y, z}));
        });
    }
    _simulationWorkerStep(properties, map, chunk, mapDimensions){
        this.getIndex = (x, y, z) => z*mapDimensions.x*mapDimensions.y + y * mapDimensions.x + x;
        const mapCopy = new Uint32Array(map);
        _cubicIteration(chunk, ({x, y, z}) => {
            const thisValue = map[this.getIndex(x, y, z)];
            const neighbors = [];
            _cubicIteration({x:-1, y:-1, z:-1, w:3, h:3, d:3}, ({x:dx, y:dy, z:dz}) => {
                dx*=properties.voxelSize; dy*=properties.voxelSize; dz*=properties.voxelSize;
                if(dx === 0 && dy === 0 && dz === 0){
                    return;
                }
                const nx = x + dx;
                const ny = y + dy;
                const nz = z + dz;
                if(nx < 0 || nx >= mapDimensions.x || ny < 0 || ny >= mapDimensions.y || nz < 0 || nz >= mapDimensions.z){
                    neighbors.push(false);
                }else{
                    neighbors.push(mapCopy[this.getIndex(nx, ny, nz)]);
                }
            });
            const neighborCount = neighbors.reduce((acc, val) => acc + val, 0);
            const newValue = this._simulationLogic(thisValue, neighborCount, properties);
            _cubicIteration({w:properties.voxelSize, h:properties.voxelSize, d:properties.voxelSize}, ({x:dx, y:dy, z:dz}) => {
                if(x+dx >= mapDimensions.x || y+dy >= mapDimensions.y || z+dz >= mapDimensions.z){
                    return;
                }
                map[this.getIndex(x+dx, y+dy, z+dz)] = newValue;
            });
        }, properties.voxelSize);
        postMessage({chunk, map});
    }
    _simulationLogic(thisValue, neighborCount, properties){
        if(thisValue){
            return neighborCount >= properties.deathLimit;
        }else{
            return neighborCount >= properties.birthLimit;
        }
    }
    _nextGenerationStep(){

        let actualStep = 0;
        let stepsUsed = 0;
        let isDone = false;
        for(let i = 0; i < this.generationProperties.length; i++){
            stepsUsed+=this.generationProperties[i].numberOfSteps || 1;
            if(stepsUsed > this.generationStep){
                actualStep = i;
                break;
            }
            if(i >= this.generationProperties.length-1 && stepsUsed <= this.generationStep){
                console.log("Generation Done");
                isDone = true;
                break;
            }
        }
        console.log("Next Generation Step", actualStep, this.generationStep);
        this.generationStep++;


        let properties = this.generationProperties[actualStep];
        if(!isDone){
            if(properties.chanceToRevive != null && properties.chanceToKill != null){
                this._addRandomness(properties);
                console.log("Randomness added", properties);
                this._nextGenerationStep();
            }
            if(properties.birthLimit != null && properties.deathLimit != null){
                // for(let i = 0; i < properties.numberOfSteps; i++){
                    this._simulationStep(properties);
                    console.log("Simulation Ran", properties);
                // }
            }
        }else{
            // this.createInstances();
            // this.createMarchingCubesMesh();
            this.createInstances(giShader.outputTextureData);
        }
    }
    generate(){
        this._randomGeneration(this.generationProperties[0]);
        this._nextGenerationStep();
        // for(let properties of this.generationProperties){
        //     if(properties.chanceToRevive != null && properties.chanceToKill != null){
        //         this._addRandomness(properties);
        //     }
        //     if(properties.birthLimit != null && properties.deathLimit != null){
        //         for(let i = 0; i < properties.numberOfSteps; i++){
        //             this._simulationStep(properties);
        //         }
        //     }
        // }
    }

    createMarchingCubesMesh(){
        // const data = MarchingCubes.generateMesh(this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z, (x, y, z) => this.readOccupancy({x, y, z}), this.scaling);
        MarchingCubes.generateMeshWithWorkers(this.mapDimensions.x, this.mapDimensions.y, this.mapDimensions.z, (x, y, z) => this.readOccupancy({x, y, z}), this.scaling, ((data) => {

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
            this.marchedMesh.material = mat;

            this.marchedMesh.position.x = -1;
        }).bind(this));
    }
    
}