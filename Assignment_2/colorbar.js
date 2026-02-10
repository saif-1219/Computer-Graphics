"use strict";

// Updated Vertex Shader to handle 800x600 resolution
var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

void main(){

    vec4 zeroToOne = a_position / vec4(800.0, 600.0, 1.0, 1.0);
    vec4 zeroToTwo = zeroToOne * 2.0;
    vec4 clipSpace = zeroToTwo - vec4(1.0, 1.0, 0.0, 0.0);
    
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);

    v_color = a_color;
}
`;

var fragmentShaderSrc = `#version 300 es

precision highp float;

in vec4 v_color;
out vec4 outColor;

void main(){
    outColor = v_color;
}
`;

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

    console.log(gl.getProgramInfoLog(program));
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

    // --- Configuration ---
    var width = 800;
    var height = 600;
    
    // Force canvas size matches the resolution logic
    canvas.width = width;
    canvas.height = height;

    var positions = [];
    var colors = [];

    // Define colors using vec4 from common.js
    var black = vec4(0.0, 0.0, 0.0, 1.0);
    var white = vec4(1.0, 1.0, 1.0, 1.0);
    var red   = vec4(1.0, 0.0, 0.0, 1.0);
    var green = vec4(0.0, 1.0, 0.0, 1.0);
    var blue  = vec4(0.0, 0.0, 1.0, 1.0);

    var topBarY1 = 50;
    var topBarY2 = 250;
    var botBarY1 = 350;
    var botBarY2 = 550;

    // Iterate through every pixel column
    for (var x = 0; x < width; x++) {
        
        // 1. Grayscale Bar (Top)
        // Interpolate between Black and White across the full width
        var grayCol = map_point(0, width, black, white, x);
        
        // Add vertical line for Top Bar
        positions.push(x, topBarY1);
        positions.push(x, topBarY2);
        
        // Add color for both vertices of the line
        colors.push(grayCol[0], grayCol[1], grayCol[2], grayCol[3]);
        colors.push(grayCol[0], grayCol[1], grayCol[2], grayCol[3]);

        // 2. RGB Bar (Bottom)
        var rgbCol;
        var mid = width / 2;
        
        if (x <= mid) {
            // First half: Red to Green
            rgbCol = map_point(0, mid, red, green, x);
        } else {
            // Second half: Green to Blue
            rgbCol = map_point(mid, width, green, blue, x);
        }

        // Add vertical line for Bottom Bar
        positions.push(x, botBarY1);
        positions.push(x, botBarY2);

        // Add color for both vertices
        colors.push(rgbCol[0], rgbCol[1], rgbCol[2], rgbCol[3]);
        colors.push(rgbCol[0], rgbCol[1], rgbCol[2], rgbCol[3]);
    }

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Bind Position
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAtribLocation);
    gl.vertexAttribPointer(positionAtribLocation, 2, gl.FLOAT, false, 0, 0);

    // Bind Color
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    resizeCanvasToDisplaySize(gl.canvas);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(1, 1, 1, 1); // White background
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw Lines
    // positions array has x,y pairs. Total vertices = length / 2
    var primitiveType = gl.LINES;
    var offset = 0;
    var count = positions.length / 2;
    gl.drawArrays(primitiveType, offset, count);
}

main();

function resizeCanvasToDisplaySize(canvas) {
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}