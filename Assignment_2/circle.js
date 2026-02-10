"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;

uniform vec2 u_resolution;

void main(){
    // Convert from pixel space to clip space using the canvas resolution
    vec2 zeroToOne = a_position.xy / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
}
`
var fragmentShaderSrc = `#version 300 es

precision highp float;

out vec4 outColor;

void main(){
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
}

`

function createDivisions(positions, radius, divisions, counter=1) {
    //creating circle points between each two points in the positions array and changing the positions array in place to include those points
    if (counter >= divisions) {
        return positions;
    }

    var new_positions = [];
    // let i  = ((2**(counter-1)) * 16)-16;
    for (let i = ((2**(counter-1)) * 16)-16; i < positions.length - 2; i += 4) {
        let x1 = positions[i];
        let y1 = positions[i + 1];
        let x2 = positions[i + 2];
        let y2 = positions[i + 3];
        let mid_x = (x1 + x2) / 2;
        let mid_y = (y1 + y2) / 2;

        let mid_x_trans = (((counter-1) * radius * 2) + radius) - mid_x;
        let mid_y_trans = radius - mid_y;

        let mid = vec2(mid_x_trans, mid_y_trans);
        let norm_mid = normalizeVector(mid);
        console.log("counter: ", counter, "norm_mid:", norm_mid);

        norm_mid[0] *= radius;
        norm_mid[1] *= radius;

        let new_x = (((counter-1) * radius * 2) + radius) - norm_mid[0];
        let new_y = radius - norm_mid[1];

        new_positions.push(x1 +  radius * 2, y1, new_x +  radius * 2, new_y , new_x +  radius * 2, new_y, x2 +  radius * 2, y2);
    }
    for (let i = 0; i < new_positions.length; i++) {
        positions.push(new_positions[i]);
    }
    console.log("positions:", positions);
    return createDivisions(positions, radius, divisions, counter + 1);
}
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

    var radius = parseFloat(prompt("Enter the radius of the circle:", "50"));
    var divisions = parseInt(prompt("Enter the number of divisions (more divisions = smoother circle):", "5"));

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAtribLocation = gl.getAttribLocation(program, "a_position");
    var colorAtribLocation = gl.getAttribLocation(program, "a_color");

    var positionBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    
    var width = radius * 2 * divisions;;
    var height = radius * 2;

    
    
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;

    var unit = radius;    


    var positions = [
        0, unit,
        unit, 0,

        unit, 0,
        unit * 2, unit,
        
        unit * 2, unit,
        unit, unit * 2,
        
        unit, unit * 2,
        0, unit
    ];

    positions = createDivisions(positions, radius, divisions);
    console.log(positions.length);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAtribLocation)

    var size = 2;          
    var type = gl.FLOAT;   
    var normalize = false; 
    var stride = 0;        
    var offset = 0;   
    gl.vertexAttribPointer(positionAtribLocation, size, type, normalize, stride, offset);

    // resizeCanvasToDisplaySize(gl.canvas);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Send canvas width/height to the shader as a uniform
    var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    var primitiveType = gl.LINES;
    var offset = 0;
    var count = positions.length / 2;
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
