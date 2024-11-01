var canvas = document.getElementById("renderCanvas");

var gl = document.createElement("canvas").getContext("webgl2");
document.body.appendChild(gl.canvas);
gl.canvas.style.width = "100%";

window.loadingScreen = new LoadingScreen();

var engine = new BABYLON.Engine(canvas,true);
var scene = new BABYLON.Scene(engine);

const caveSize = Math.min(128, gl.getParameter(gl.MAX_3D_TEXTURE_SIZE));
const caveDimensions = {x: caveSize, y: caveSize, z:64};
// cave_size = {x: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE), y: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE), z:128};

var cave = new GPUCaveGeneration(scene, gl, caveDimensions);
var game = new Game(scene, engine);

var drone = new Drone(scene);


var giShader = new GIShader(gl, cave.mapDimensions, caveDimensions);

let dummyTextureDataRGBA = new Uint8Array(cave.mapDimensions.x * cave.mapDimensions.y*cave.mapDimensions.z*4);
for(let i = 0; i < dummyTextureDataRGBA.length; i++){
    dummyTextureDataRGBA[i] = Math.min(Math.max(Math.random()*255, 0), 255);
    if(i%4 === 3){
        dummyTextureDataRGBA[i] = 255;
    }
}
let dummyTextureDataG = new Uint8Array(cave.mapDimensions.x * cave.mapDimensions.y*cave.mapDimensions.z);
for(let i = 0; i < dummyTextureDataG.length; i++){
    dummyTextureDataG[i] = Math.min(Math.max(Math.random()*255, 0), 255);
}

// for(let x = 0; x < gi.volumeDimensions.x; x++){
//     for(let y = 0; y < gi.volumeDimensions.y; y++){
//         for(let z = 0; z < gi.volumeDimensions.z; z++){
//             gi.dataTextureData[((x*gi.volumeDimensions.y + y)*gi.volumeDimensions.z + z)*4] = x/16*255;
//             gi.dataTextureData[((x*gi.volumeDimensions.y + y)*gi.volumeDimensions.z + z)*4+1] = y/16*255;
//             gi.dataTextureData[((x*gi.volumeDimensions.y + y)*gi.volumeDimensions.z + z)*4+2] = z/16*255;
//             gi.dataTextureData[((x*gi.volumeDimensions.y + y)*gi.volumeDimensions.z+ z)*4+3] = 255;
//         }
//     }
// }

// cave.generate();

// spector.captureCanvas(gl.canvas)

// requestAnimationFrame(function loop(){

    cave.generate();
    // cave.genShader.draw();
    // requestAnimationFrame(loop);
// });


giShader.loadOccupancyData(cave.occupancyMap);


// spector.captureNextFrame(gl.canvas)
giShader.shaderSetup();
giShader.draw();
// requestAnimationFrame(function loop(){

//     for(let i = 0; i < giShader.outputTextureData.length; i++){
//         giShader.outputTextureData[i] = Math.min(Math.max(Math.random()*255, 0), 255);
//         if(i%4 === 3){
//             giShader.outputTextureData[i] = 255;
//         }
    // }
    // giShader.draw();
    // requestAnimationFrame(loop);
// });
for(let i = 0; i < 2; i++){
//     console.log(giShader.outputTextureData);
    giShader.draw();
}
cave.setVoxelLighting(giShader.getOutputData());
// console.log(giShader.outputTextureData);


// cave.createInstances(dummyTextureDataRGBA);





// cave._randomGeneration();
// cave.createInstances(gi.outputTextureData);
cave.createMarchingCubesMesh((() => {
    game.sunShadowGenerator.getShadowMap().refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    window.scattering = new Scattering(scene, drone.camera3rd, game.sun, game.sunShadowGenerator);
    window.scattering.addShadowMesh(cave.marchedMesh);
    window.scattering.calculateScattering();
    setupPointerLock();
    console.log("done creating mesh");
}).bind(this));
cave.marchedMesh.scaling = cave.marchedMesh.scaling.scale(5);
cave.marchedMesh.checkCollisions = true;
game.sunShadowGenerator.addShadowCaster(cave.marchedMesh);
cave.marchedMesh.receiveShadows = true;
let shadowMat = new BABYLON.StandardMaterial("shadowMat", scene);
shadowMat.backFaceCulling = false;
game.sunShadowGenerator.getShadowMap().setMaterialForRendering(cave.marchedMesh, shadowMat);


game.water.material.reflectionTexture.renderList.push(cave.marchedMesh);
game.water.material.reflectionTexture.renderList.push(drone.mesh);

var ssao = new BABYLON.SSAORenderingPipeline("ssaopipeline", scene, 0.75, game.camera);

var defaultPipeline = new BABYLON.DefaultRenderingPipeline("default", true, scene, [scene.activeCamera]);
defaultPipeline.bloomEnabled = true;
defaultPipeline.fxaaEnabled = true;
defaultPipeline.bloomWeight = 0.1;
defaultPipeline.bloomKernel = 32;
defaultPipeline.bloomThreshold = 0.92
defaultPipeline.cameraFov = scene.activeCamera.fov;

// setTimeout(function(){
// 
// }, 1000);


keys = {};
canvas.addEventListener("keydown", function (e){
    keys[e.key.toLowerCase()] = true;
});
canvas.addEventListener("keyup", function (e){
    keys[e.key.toLowerCase()] = false;
    
});

let mouseX = 0; let mouseY = 0;
let mouseYMax = engine.getRenderHeight()/2*(Math.PI-0.2);
let mouseYMin = -engine.getRenderHeight()/2*(Math.PI-0.2);
let mouseSensitivity = 0.15;

function mouseMove(e){
    var movementX = e.movementX ||
        e.mozMovementX ||
        e.webkitMovementX ||
        0;

    var movementY = e.movementY ||
        e.mozMovementY ||
        e.webkitMovementY ||
        0;

    mouseX -= movementX * mouseSensitivity * engine.getDeltaTime();
    mouseY += movementY * mouseSensitivity * engine.getDeltaTime();

    mouseY = Math.min(Math.max(mouseYMin, mouseY), mouseYMax);

    drone.setMouseValues(mouseX, mouseY);
}


function setupPointerLock(){
    // register the callback when a pointerlock event occurs
    document.addEventListener('pointerlockchange', changeCallback, false);
    document.addEventListener('mozpointerlockchange', changeCallback, false);
    document.addEventListener('webkitpointerlockchange', changeCallback, false);

    // when element is clicked, we're going to request a
    // pointerlock
    canvas.onclick = function(){
        canvas.requestPointerLock = 
            canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock
        ;

        // Ask the browser to lock the pointer)
        canvas.requestPointerLock();
    };

}

function changeCallback(e){
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas
    ){
        // we've got a pointerlock for our element, add a mouselistener
        document.addEventListener("mousemove", mouseMove, false);
    } else {
        // pointer lock is no longer active, remove the callback
        document.removeEventListener("mousemove", mouseMove, false);
    }
}

var moveVector = new BABYLON.Vector3(0, 0, 0);
var moveSpeed = 0.01;
engine.runRenderLoop(function () {
    // giShader.draw();
    
    moveVector.set(0, 0, 0);
    if(keys["w"]){moveVector.z += moveSpeed;
    }if(keys["s"]){ moveVector.z += -moveSpeed;
    }if(keys["a"]){ moveVector.x += -moveSpeed;
    }if(keys["d"]){ moveVector.x += moveSpeed;
    }if(keys[" "]){ moveVector.y += moveSpeed;
    }if(keys["shift"]){ moveVector.y += -moveSpeed;
    }
    drone.control(moveVector);
    drone.update();
    game.update();
    scene.render();
}
);
window.addEventListener("resize", function () {
    engine.resize();
}
);

loadingScreen.hide();