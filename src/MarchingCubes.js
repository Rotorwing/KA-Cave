class MarchingCubes{
    static ISOLEVEL = 0.3;//0.05;

    static getCubeIndex(cubeValues){
        let cubeIndex = 0;
        for (let i = 0; i < cubeValues.length; i++) {
            if (cubeValues[i] < MarchingCubes.ISOLEVEL) {
                cubeIndex += Math.pow(2, i);
            }
        }
        return cubeIndex;
    }

    static getEdges(cubeIndex){
        return MarchingTables.TRIANGLES[cubeIndex];
    }

    static getTriangles(cubeValues, worldPos, scaling){
        const cubeIndex = this.getCubeIndex(cubeValues);
        const edges = this.getEdges(cubeIndex);
        // console.log(cubeValues, cubeIndex, edges);
        const triangles = [];
        for (let i = 0; edges[i] != -1; i+=3) {

            // First edge lies between vertex e00 and vertex e01
            let e00 = MarchingTables.EDGE_CONNECTIONS[edges[i]][0];
            let e01 = MarchingTables.EDGE_CONNECTIONS[edges[i]][1];

            // Second edge lies between vertex e10 and vertex e11
            let e10 = MarchingTables.EDGE_CONNECTIONS[edges[i + 1]][0];
            let e11 = MarchingTables.EDGE_CONNECTIONS[edges[i + 1]][1];
            
            // Third edge lies between vertex e20 and vertex e21
            let e20 = MarchingTables.EDGE_CONNECTIONS[edges[i + 2]][0];
            let e21 = MarchingTables.EDGE_CONNECTIONS[edges[i + 2]][1];

            const tri = {a: [], b: [], c: []};
            tri.a = MarchingCubes._interp(MarchingTables.CORNER_OFFSETS[e00], cubeValues[e00], MarchingTables.CORNER_OFFSETS[e01], cubeValues[e01]);
            tri.b = MarchingCubes._interp(MarchingTables.CORNER_OFFSETS[e10], cubeValues[e10], MarchingTables.CORNER_OFFSETS[e11], cubeValues[e11]);
            tri.c = MarchingCubes._interp(MarchingTables.CORNER_OFFSETS[e20], cubeValues[e20], MarchingTables.CORNER_OFFSETS[e21], cubeValues[e21]);
            
            for(let vert in tri){
                tri[vert][0] = (tri[vert][0]+ worldPos.x) * scaling;
                tri[vert][1] = (tri[vert][1]+ worldPos.y) * scaling;
                tri[vert][2] = (tri[vert][2]+ worldPos.z) * scaling;

                // FLIPPED INDEXES
                let t = tri[vert][1];
                tri[vert][1] = tri[vert][2];
                tri[vert][2] = t;
            }
            // console.log(tri[vert[0]], tri);
            triangles.push(tri);

        }
        return triangles;
    }

    static generateMesh(width, height, depth, sampleFunction, scaling){
        let vertices = [];
        let indices = [];
        for (let x = -1; x < width; x++) {
            for (let y = -1; y < height; y++) {
                for (let z = -1; z < depth; z++) {
                    const cubeValues = [];
                    for (let i = 0; i < 8; i++) {
                        const corner = MarchingTables.CORNER_OFFSETS[i];
                        // if (x < 5 && y <5 && z<2) console.log(x + corner[0], y + corner[1], z + corner[2]);
                        if (x + corner[0] < 0 || x + corner[0] >= width || y + corner[1] < 0 || y + corner[1] >= height || z + corner[2] < 0 || z + corner[2] >= depth) {
                            cubeValues.push(0);
                            continue;
                        }
                        cubeValues.push(sampleFunction(x + corner[0], y + corner[1], z + corner[2]));
                    }
                    // if (x < 25 && y <5 && z<2) console.log(cubeValues);
                    const worldPos ={x, y, z};
                    const triangles = this.getTriangles(cubeValues, worldPos, scaling);
                    for (let i = 0; i < triangles.length; i++) {
                        const vertexIndex = vertices.length;
                        // console.log(triangles[i].a);
                        vertices = vertices.concat(triangles[i].a);
                        vertices = vertices.concat(triangles[i].b);
                        vertices = vertices.concat(triangles[i].c);
                        indices.push(vertexIndex/3);
                        indices.push(vertexIndex/3 + 1);
                        indices.push(vertexIndex/3 + 2);
                    }
                }
            }
        }
        return {vertices, indices};
    }

    static generateMeshWithWorkers(width, height, depth, sampleFunction, scaling, callback){
        const chunkSize = 16;
        const chunks = [];
        for (let x = 0; x < width; x+=chunkSize-1) {
            for (let y = 0; y < height; y+=chunkSize-1) {
                for (let z = 0; z < depth; z+=chunkSize-1) {
                    chunks.push({x, y, z, w: Math.min(width, chunkSize+x)-x, h: Math.min(height, chunkSize+y)-y, d: Math.min(depth, chunkSize+z)-z});
                }
            }
        }
        let chunkIndex = 0;
        const results = [];
        const workerCallback = (data) => {
            console.log("Worker Done.");
            results.push(data);
            if (results.length === chunks.length) { ///!!!!!!!!!!!!!!
                let vertices = [];
                let indices = [];
                for (let i = 0; i < results.length; i++) {
                    vertices = vertices.concat(results[i].vertices);
                    for (let j = 0; j < results[i].indices.length; j++) {
                        indices.push(results[i].indices[j] + chunkIndex);
                    }
                    chunkIndex += results[i].vertices.length / 3;
                }
                callback({vertices, indices});
            }
        }

        const pool = new WorkerPool(8, MarchingCubes.workerScript, [MarchingTables, MarchingCubes]);
        pool.onWorkerFinishCallback = workerCallback;
        
        for (let i = 0; i < chunks.length; i++) {
            this.generationWorker(chunks[i], sampleFunction, scaling, pool);
        }
        // console.log(chunks);
    }

    static generationWorker(chunk, sampleFunction, scaling, workerPool){
        const chunkValues = [];
        for (let x = chunk.x; x < chunk.x+chunk.w; x++) {
            for (let y = chunk.y; y < chunk.y+chunk.h; y++) {
                for (let z = chunk.z; z < chunk.z+chunk.d; z++) {
                    chunkValues.push(sampleFunction(x, y, z));
                }
            }
        }
        workerPool.run({chunkValues, chunkInfo:chunk, scaling});
        // let workerContent = MarchingCubes.workerScript.toString();
        // workerContent = workerContent.slice(workerContent.indexOf('{')+1, workerContent.lastIndexOf('}'))
        // workerContent = workerContent.replaceAll('  ', '');
        // workerContent += '\n';
        // workerContent += MarchingCubes.toString();
        // workerContent += '\n';
        // workerContent += MarchingTables.toString();
        // // workerContent = workerContent.replaceAll('\n', '');
        // workerContent = workerContent.replaceAll('\t', '');
        // console.log(workerContent);

        // let url = URL.createObjectURL( new Blob( [ workerContent ], { type: "text/javascript" } ) );
        // var worker = new Worker(url);
        // worker.postMessage({chunkValues, chunkInfo:chunk, scaling});
        // worker.onmessage = (e) => callback(e.data);
    }
    static workerScript(chunkValues, chunkInfo, scaling){
        // onmessage = (e) => {
        //     let {chunkValues, chunkInfo, scaling} = e.data;
            // console.log(chunkInfo);
            width = chunkInfo.w;
            height = chunkInfo.h;
            depth = chunkInfo.d;
            let vertices = [];
            let indices = [];
            for (let x = 0; x < width-1; x++) {
                for (let y = 0; y < height-1; y++) {
                    for (let z = 0; z < depth-1; z++) {
                        const cubeValues = [];
                        for (let i = 0; i < 8; i++) {
                            const corner = MarchingTables.CORNER_OFFSETS[i];
                            // if (x < 5 && y <5 && z<2) console.log(x + corner[0], y + corner[1], z + corner[2]);
                            if (x + corner[0] < 0 || x + corner[0] >= width || y + corner[1] < 0 || y + corner[1] >= height || z + corner[2] < 0 || z + corner[2] >= depth) {
                                cubeValues.push(0);
                                continue;
                            }
                            const index = (x + corner[0]) * height * depth + (y + corner[1]) * depth + z + corner[2];
                            cubeValues.push(chunkValues[index]);
                        }
                        // if (x < 25 && y <5 && z<2) console.log(cubeValues);
                        const worldPos ={x:x+chunkInfo.x, y:y+chunkInfo.y, z:z+chunkInfo.z};
                        const triangles = MarchingCubes.getTriangles(cubeValues, worldPos, scaling);
                        for (let i = 0; i < triangles.length; i++) {
                            const vertexIndex = vertices.length;
                            // console.log(triangles[i].a);
                            vertices = vertices.concat(triangles[i].a);
                            vertices = vertices.concat(triangles[i].b);
                            vertices = vertices.concat(triangles[i].c);
                            indices.push(vertexIndex/3);
                            indices.push(vertexIndex/3 + 1);
                            indices.push(vertexIndex/3 + 2);
                        }
                    }
                }
                // console.log("progress", Math.floor(x/(width-2)*1000)/10);
                // postMessage({progress: (x/(width-2));
            }
            postMessage( {vertices, indices} );
        //     postMessage({vertices, indices});
        // }
    }

    static optimizeMesh({vertices, indices}){
        const newVertices = [];
        const newIndices = [];
        const vertexMap = {};
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            const vertex = vertices.slice(index*3, index*3+3);
            const vertexKey = vertex.join(',');
            if (vertexMap[vertexKey] == null) {
                vertexMap[vertexKey] = newVertices.length / 3;
                newVertices.push(...vertex);
            }
            newIndices.push(vertexMap[vertexKey]);
        }
        return {vertices: newVertices, indices: newIndices};
    }

    static _interp(edgeVertex1, valueAtVertex1, edgeVertex2, valueAtVertex2){
        // return [(edgeVertex2[0] + edgeVertex1[0])/2, (edgeVertex2[1] + edgeVertex1[1])/2, (edgeVertex2[2] + edgeVertex1[2])/2];
        const vert = [0, 0, 0];
        for(let i = 0; i < 3; i++){
            vert[i] = edgeVertex1[i] + (MarchingCubes.ISOLEVEL - valueAtVertex1) * (edgeVertex2[i] - edgeVertex1[i])  / (valueAtVertex2 - valueAtVertex1);
        }
        return vert;
    }
    /*
    float3 interp(float3 edgeVertex1, float valueAtVertex1, float3 edgeVertex2, float valueAtVertex2)
    {
        return (edgeVertex1 + (isoLevel - valueAtVertex1) * (edgeVertex2 - edgeVertex1)  / (valueAtVertex2 - valueAtVertex1));
    }
    */
}