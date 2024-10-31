

const gl = document.createElement("canvas").getContext("webgl2");
document.body.appendChild(gl.canvas);
gl.canvas.style.width = "100%";

const gi = new GIShader(gl);
for(let i = 0; i < giShader.dataTextureData.length; i++){
    giShader.dataTextureData[i] = Math.min(Math.max(Math.random()*255, 0), 255);
    if(i%4 === 3){
        giShader.dataTextureData[i] = 255;
    }
}
giShader.shaderSetup();
// gi.draw();

requestAnimationFrame(function loop(){
    giShader.draw();
    requestAnimationFrame(loop);
});