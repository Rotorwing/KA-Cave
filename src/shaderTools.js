/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {*} shaderInfo 
 * @returns {WebGLProgram}
 */

function buildShaderProgram(gl, shaderInfo, buildDefines) {
    const program = gl.createProgram();

    shaderInfo.forEach((desc) => {
        let shader;
        if (desc.id) {
            shader = compileShader(gl, desc.type, desc.id, null, buildDefines);
        }else{
            shader = compileShader(gl, desc.type, null, desc.path, buildDefines);
        }

        if (shader) {
        gl.attachShader(program, shader);
        }
    });

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Error linking shader program:");
        console.log(gl.getProgramInfoLog(program));
    }

    return program;
}
function compileShader(gl, type, id=null, path=null, buildDefines) {
    let code = "";
    if (id !== null) {
        code = document.getElementById(id).firstChild.nodeValue;
    }else{
        const request = new XMLHttpRequest();
        request.open("GET", path, false);
        request.send(null);
        code = request.responseText;
        code = code.replace(/#define[ ]*(?<name>[a-zA-Z0-9_]*)[ ]*(?<val>[a-zA-Z0-9_]*)/g, (match, name, val) => {
            if(buildDefines[name]){
                // console.log(`#define ${name} ${buildDefines[name]}`);
                return `#define ${name} ${buildDefines[name]}`;
            }else{
                return `#define ${name} ${val}`;
            }
        });
    }
    
    const shader = gl.createShader(type);

    gl.shaderSource(shader, code);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(
        `Error compiling ${
            type === gl.VERTEX_SHADER ? "vertex" : "fragment"
        } shader:`,
        );
        console.log(gl.getShaderInfoLog(shader));
    }
    return shader;
}

function SquareVertexArray(){
    return new Float32Array([
        0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0,
    ]);
}
function SquareStripVertexArray(){
    return new Float32Array([
        0, 1, 1, 1, 0, 0, 1, 0
    ]);
}