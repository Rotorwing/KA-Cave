var canvas = document.getElementById("renderCanvas");

var gl = document.createElement("canvas").getContext("webgl2");
document.body.appendChild(gl.canvas);
gl.canvas.style.width = "100%";

window.loadingScreen = new LoadingScreen();
loadingScreen.addTask("Shaders", "loading...")

var engine = new BABYLON.Engine(canvas,true);
var scene = new BABYLON.Scene(engine);

const caveSize = Math.min(128, gl.getParameter(gl.MAX_3D_TEXTURE_SIZE));
const caveDimensions = {x: caveSize, y: caveSize, z:64};
// cave_size = {x: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE), y: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE), z:128};


var game = new Game(scene, engine);

let presetSettings = {
    "High":{
        scatteringEnabled: true,
        caveSize: 128,
        ssaoEnabled: true,
        fxaaEnabled: true,
        bloomEnabled: true,
        waterReflectionsEnabled: true
    },
    "Medium":{
        scatteringEnabled: true,
        caveSize: 128,
        ssaoEnabled: false,
        fxaaEnabled: false,
        bloomEnabled: false,
        waterReflectionsEnabled: true
    },
    "Low":{
        scatteringEnabled: false,
        caveSize: 64,
        ssaoEnabled: false,
        fxaaEnabled: false,
        bloomEnabled: false,
        waterReflectionsEnabled: false
    }
}


document.getElementById("optionsScreen").style.display = "block";
loadingScreen.removeTask("Shaders")
window.gameStarted = false;
document.getElementById("startBtn").onclick = function(e){
    let value = document.getElementById("graphicsQuality").value
    document.getElementById("optionsScreen").style.display = "none";
    if(value == "Custom"){
        game.settings = window.customSettings;
    }else{
        game.settings = presetSettings[value]
    }
    setTimeout((function(){
        window.gameStarted = true;
        game.setup();
        engine.runRenderLoop(function () {
            // giShader.draw();
            game.update(keys);
            scene.render();
        }
        );
    }).bind(this), 100);
}


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

    game.drone.setMouseValues(mouseX, mouseY);
}


function setupPointerLock(){
    // register the callback when a pointerlock event occurs
    document.addEventListener('pointerlockchange', changeCallback, false);
    document.addEventListener('mozpointerlockchange', changeCallback, false);
    document.addEventListener('webkitpointerlockchange', changeCallback, false);

    // when element is clicked, we're going to request a pointerlock
    canvas.onclick = function(){
        canvas.requestPointerLock = 
            canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock
        ;

        // Ask the browser to lock the pointer
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
// engine.runRenderLoop(function () {
//     // giShader.draw();
    
//     if(window.gameStarted){g
//         ame.update(keys);
//         scene.render();
//     }
// }
// );
window.addEventListener("resize", function () {
    engine.resize();
}
);

loadingScreen.hide();