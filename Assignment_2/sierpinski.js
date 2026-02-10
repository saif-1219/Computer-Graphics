function sierpinski(vertices, recursion, invVertices=[]){
    if (recursion === 1){
        return [vertices, invVertices];
    }
    // vertices is a one dimensional array of x,y coordinates
    let newVertices = [];

    if (vertices.length === 6){
        // If we have a single triangle
        let ax = vertices[0];
        let ay = vertices[1];
        let bx = vertices[2];
        let by = vertices[3];
        let cx = vertices[4];
        let cy = vertices[5];

        // calculate midpoints
        let abx = (ax + bx) / 2;
        let aby = (ay + by) / 2;
        let bcx = (bx + cx) / 2;
        let bcy = (by + cy) / 2;
        let cax = (cx + ax) / 2;
        let cay = (cy + ay) / 2;
        newVertices.push(ax, ay, 1.0, abx, aby, 1.0, cax, cay, 1.0);
        newVertices.push(abx, aby, 1.0, bcx, bcy, 1.0, bx, by, 1.0);
        newVertices.push(bcx, bcy, 1.0, cx, cy, 1.0, cax, cay, 1.0);
        invVertices.push(abx, aby, 0.0, bcx, bcy, 0.0, cax, cay, 0.0);

        return sierpinski(newVertices, recursion - 1, invVertices);
    }
    for (let i = 0; i < vertices.length; i += 9){
        let ax = vertices[i];
        let ay = vertices[i+1];
        let bx = vertices[i+3];
        let by = vertices[i+4];
        let cx = vertices[i+6];
        let cy = vertices[i+7];

        // calculate midpoints
        let abx = (ax + bx) / 2;
        let aby = (ay + by) / 2;
        let bcx = (bx + cx) / 2;
        let bcy = (by + cy) / 2;
        let cax = (cx + ax) / 2;
        let cay = (cy + ay) / 2;
        newVertices.push(ax, ay, 1.0, abx, aby, 1.0, cax, cay, 1.0);
        newVertices.push(abx, aby, 1.0, bcx, bcy, 1.0, bx, by, 1.0);
        newVertices.push(bcx, bcy, 1.0, cx, cy, 1.0, cax, cay, 1.0);
        invVertices.push(abx, aby, 0.0, bcx, bcy, 0.0, cax, cay, 0.0);
    }
    // console.log(newVertices);
    return sierpinski(newVertices, recursion - 1, invVertices);
}

"use strict";

var vertexShaderSrc = `#version 300 es

in vec3 a_position;
out float v_flag;

void main(){
    // Translate to origin
    
    vec2 pos = a_position.xy;
    v_flag = a_position.z;
    vec4 zeroToOne = vec4(pos, 0.0, 0.0) / vec4(500.0, 500.0, 1.0, 1.0);
    vec4 zeroToTwo = zeroToOne * 2.0;
    vec4 clipSpace = zeroToTwo - vec4(1.0, 1.0, 0.0, 0.0);
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

}
`
var fragmentShaderSrc = `#version 300 es

precision highp float;

in float v_flag;
out vec4 outColor;

void main(){
    if (v_flag == 1.0) {
        outColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        outColor = vec4(0.0, 0.0, 1.0, 1.0);
    }
}

`
function createShader(gl, type, src){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
  }

    console.log(gl.getProgramInfoLog(program));  // eslint-disable-line
    gl.deleteProgram(program);
    return undefined;
}



function main(){
    var canvas = document.querySelector("#c");
    var gl = canvas.getContext("webgl2");
    if (!gl){
        return;
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAtribLocation = gl.getAttribLocation(program, "a_position");
    var colorAtribLocation = gl.getAttribLocation(program, "a_color");

    var positionBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    
    var width = 500;
    var height = 500;
    
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;
    
    var mainTriangle = [
        width/2-150, height/2+150,
        width/2, height/2-150,
        width/2+150, height/2+150,
    ];

    var [positions, invPositions] = sierpinski(mainTriangle, 5);
    // combine both sets so the flag (third value) is used per-vertex to decide color
    var allPositions = positions.concat(invPositions);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allPositions), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAtribLocation)

    var size = 3;          
    var type = gl.FLOAT;   
    var normalize = false; 
    var stride = 0;
    var offset = 0;   
    gl.vertexAttribPointer(positionAtribLocation, size, type, normalize, stride, offset);

    resizeCanvasToDisplaySize(gl.canvas);

    gl.useProgram(program);
    gl.bindVertexArray(vao);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = allPositions.length / 3;
    gl.drawArrays(primitiveType, offset, count);


}

main();



function resizeCanvasToDisplaySize(canvas) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}