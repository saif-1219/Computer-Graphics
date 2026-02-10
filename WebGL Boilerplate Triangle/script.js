"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

uniform float u_rotation;
uniform vec2 u_center;

void main(){
    // Translate to origin
    vec2 translated = a_position.xy - u_center;
    
    // Apply 2D rotation around origin
    float cosA = cos(u_rotation);
    float sinA = sin(u_rotation);
    vec2 rotatedPos = vec2(
        translated.x * cosA - translated.y * sinA,
        translated.x * sinA + translated.y * cosA
    );
    
    // Translate back to center
    rotatedPos = rotatedPos + u_center;
    
    vec4 rotated = vec4(rotatedPos, a_position.z, a_position.w);
    vec4 zeroToOne = rotated / vec4(500.0, 500.0, 1.0, 1.0);
    vec4 zeroToTwo = zeroToOne * 2.0;
    vec4 clipSpace = zeroToTwo - vec4(1.0, 1.0, 0.0, 0.0);
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

    v_color = a_color;
}
`
var fragmentShaderSrc = `#version 300 es

precision highp float;

in vec4 v_color;
out vec4 outColor;

void main(){
    outColor = v_color;
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
    var rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
    var centerUniformLocation = gl.getUniformLocation(program, "u_center");

    var positionBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    
    var width = 500;
    var height = 500;
    
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;
    
    var positions = [
        width/2-80, height/2+80,
        width/2, height/2-80,
        width/2+80, height/2+80,
    ];
    
    // Calculate triangle center
    var centerX = (positions[0] + positions[2] + positions[4]) / 3;
    var centerY = (positions[1] + positions[3] + positions[5]) / 3;
    
    var colors = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 1.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
    ];
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionAtribLocation)

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(positionAtribLocation, size, type, normalize, stride, offset);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    resizeCanvasToDisplaySize(gl.canvas);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Animation loop
    function render(now) {
        // Convert time to seconds and calculate rotation angle
        var rotation = (now * 0.001) % (Math.PI * 2); // Full rotation every ~6.28 seconds
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Update rotation and center uniforms
        gl.uniform1f(rotationUniformLocation, rotation);
        gl.uniform2f(centerUniformLocation, centerX, centerY);

        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = 3;
        gl.drawArrays(primitiveType, offset, count);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
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
