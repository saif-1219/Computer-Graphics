"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

void main(){
    // Translate to origin
    
    vec4 zeroToOne = a_position / vec4(500.0, 500.0, 1.0, 1.0);
    vec4 zeroToTwo = zeroToOne * 2.0;
    vec4 clipSpace = zeroToTwo - vec4(1.0, 1.0, 0.0, 0.0);
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    gl_PointSize = 10.0;

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

    var positionBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();

    
    var width = 500;
    var height = 500;
    
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;

    
    
    var positions = [];
    var colors = [];
    var drawTrianglesMode = true; 
    var pointMode = true;

    // click handler for canvas points
    canvas.addEventListener("mousedown", function(event) {
        const mousePos = getMousePos(canvas, event);
        positions.push(mousePos.x, mousePos.y);
        colors.push(Math.random(), Math.random(), Math.random(), 1.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    });

    // draw button listener
    var drawButton = document.getElementById("draw");
    if (drawButton) {
        drawButton.addEventListener("click", function() {
            pointMode = false;
        });
    }

    var clearButton = document.getElementById("clear");
    if (clearButton) {
        clearButton.addEventListener("click", function() {
            positions = [];
            colors = [];
            pointMode = true;
            drawTrianglesMode = true;
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
        });
    }

    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAtribLocation)

    var size = 2;          
    var type = gl.FLOAT;   
    var normalize = false; 
    var stride = 0;        
    var offset = 0;   
    gl.vertexAttribPointer(positionAtribLocation, size, type, normalize, stride, offset);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // event listener
    document.addEventListener("keydown", keyDownHandler);


    function keyDownHandler(event) {
        switch (event.code) {
            case "KeyR": // clear all points 
                positions = [];
                colors = [];
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
                console.log("Cleared points via R key");
                break;
            case "KeyT": // toggle triangle drawing mode
                drawTrianglesMode = !drawTrianglesMode;
                console.log("Triangle mode", drawTrianglesMode ? "on" : "off");
                break;
        }
    }


    function render() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var count = positions.length / 2;
        if (count > 0) {
            if (pointMode) {
                gl.drawArrays(gl.POINTS, 0, count);
            }
            else {
                if (drawTrianglesMode) {
                    var triCount = Math.floor(count / 3);
                    if (triCount > 0) {
                        gl.drawArrays(gl.TRIANGLES, 0, triCount * 3);
                    }
                    var leftover = count - triCount * 3;
                    if (leftover > 0) {
                        gl.drawArrays(gl.POINTS, triCount * 3, leftover);
                    }
                } else {
                    // draw quads by make each group of 4 vertices a TRIANGLE_FAN
                    var quadCount = Math.floor(count / 4);
                    for (var i = 0; i < quadCount; ++i) {
                        var base = i * 4;
                        gl.drawArrays(gl.TRIANGLE_FAN, base, 4);
                    }
                    var leftover = count - quadCount * 4;
                    if (leftover > 0) {
                        gl.drawArrays(gl.POINTS, quadCount * 4, leftover);
                    }
                }
            }
        }

        requestAnimationFrame(render);
    }

    render();
}

main();


// Helper function to get mouse position relative to the canvas
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect(); 
    return {
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top  
    };
}




