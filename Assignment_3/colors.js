"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

void main(){


    vec4 zeroToOne = a_position / vec4(500.0, 500.0, 1.0, 1.0);
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

    var fill = document.getElementById("Fill_Type");
    var fillType = fill.options[fill.selectedIndex].value;

    var shading = document.getElementById("Shading_Type");
    var shadingType = shading.options[shading.selectedIndex].value;

    var v1 = document.getElementById("v1");
    var v2 = document.getElementById("v2");
    var v3 = document.getElementById("v3");
    var v1_color = v1.value;
    var v2_color = v2.value;
    var v3_color = v3.value;

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
       // Full rotation every ~6.28 seconds

       v1_color = v1.value;
       v2_color = v2.value;
       v3_color = v3.value;

       shadingType = shading.options[shading.selectedIndex].value;

       fillType = fill.options[fill.selectedIndex].value;

       var colors = [
        parseInt(v1_color.slice(1, 3), 16) / 255, parseInt(v1_color.slice(3, 5), 16) / 255, parseInt(v1_color.slice(5, 7), 16) / 255, 1.0,
        parseInt(v2_color.slice(1, 3), 16) / 255, parseInt(v2_color.slice(3, 5), 16) / 255, parseInt(v2_color.slice(5, 7), 16) / 255, 1.0,
        parseInt(v3_color.slice(1, 3), 16) / 255, parseInt(v3_color.slice(3, 5), 16) / 255, parseInt(v3_color.slice(5, 7), 16) / 255, 1.0,
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (shadingType === "flat") {
            gl.disableVertexAttribArray(colorAtribLocation);
            colors = colors.slice(0, 4); 
            gl.vertexAttrib4fv(colorAtribLocation, colors);
        } 
        else {
            gl.enableVertexAttribArray(colorAtribLocation);
        }

        if (fillType === "boundry") {
            gl.drawArrays(gl.LINE_LOOP, 0, 3);
        }
        else {
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
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
