"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;

in vec4 a_color;
out vec4 v_color;

uniform mat4 u_matrix;

void main(){
    gl_Position = u_matrix * a_position;

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
    return undefined;
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


function getMidpoint(vA, vB) {
    return [
        (vA[0] + vB[0]) / 2,
        (vA[1] + vB[1]) / 2,
        (vA[2] + vB[2]) / 2
    ];
}

function generateTetrix(v0, v1, v2, v3, level, positions, colors) {
    if (level === 0) {
        // BASE CASE: We reached the target depth. Draw the 4 faces of this tetrahedron.

        // Standard colors for the faces 
        const colorFront  = [1.0, 0.0, 0.0, 1.0]; // Red
        const colorRight  = [0.0, 1.0, 0.0, 1.0]; // Green
        const colorLeft   = [0.0, 0.0, 1.0, 1.0]; // Blue
        const colorBottom = [1.0, 1.0, 0.0, 1.0]; // Yellow

        // Face 1: Front (v0, v1, v2)
        positions.push(...v0, ...v1, ...v2);
        colors.push(...colorFront, ...colorFront, ...colorFront);

        // Face 2: Right (v0, v2, v3)
        positions.push(...v0, ...v2, ...v3);
        colors.push(...colorRight, ...colorRight, ...colorRight);

        // Face 3: Left (v0, v3, v1)
        positions.push(...v0, ...v3, ...v1);
        colors.push(...colorLeft, ...colorLeft, ...colorLeft);

        // Face 4: Bottom (v1, v3, v2)
        positions.push(...v1, ...v3, ...v2);
        colors.push(...colorBottom, ...colorBottom, ...colorBottom);
        
        return;
    }

    // RECURSIVE STEP: Find the 6 midpoints of the current tetrahedron's edges
    const m01 = getMidpoint(v0, v1);
    const m02 = getMidpoint(v0, v2);
    const m03 = getMidpoint(v0, v3);
    const m12 = getMidpoint(v1, v2);
    const m13 = getMidpoint(v1, v3);
    const m23 = getMidpoint(v2, v3);

    generateTetrix(v0, m01, m02, m03, level - 1, positions, colors); // Top
    generateTetrix(m01, v1, m12, m13, level - 1, positions, colors); // Front-Left
    generateTetrix(m02, m12, v2, m23, level - 1, positions, colors); // Front-Right
    generateTetrix(m03, m13, m23, v3, level - 1, positions, colors); // Back
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
    var rotationUniformLocation = gl.getUniformLocation(program, "u_matrix");

    var width = 500;
    var height = 500;
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;


    const v0 = [0, 150, 0];       // Top
    const v1 = [-100, -50, -100]; // Front-left
    const v2 = [100, -50, -100];  // Front-right
    const v3 = [0, -50, 100];     // Back

    var finalPositions = [];
    var finalColors = [];
    
    var recursionLevel = document.getElementById("recursion");
    
    var recursionValue = Math.min(parseInt(recursionLevel.value), 6);

    generateTetrix(v0, v1, v2, v3, recursionValue, finalPositions, finalColors);

    var vertexCount = Math.pow(4, recursionValue) * 12;


    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalPositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAtribLocation);
    gl.vertexAttribPointer(positionAtribLocation, 3, gl.FLOAT, false, 0, 0);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);


    recursionLevel.addEventListener("input", function() {
        // update recursion and clamp
        recursionValue = Math.min(parseInt(recursionLevel.value), 6);
        finalPositions.length = 0; // Clear previous positions
        finalColors.length = 0;
        generateTetrix(v0, v1, v2, v3, recursionValue, finalPositions, finalColors);

        // update count and WebGL buffers so changes become visible
        vertexCount = Math.pow(4, recursionValue) * 12;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalPositions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(finalColors), gl.STATIC_DRAW);
    });

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    var xRot = document.getElementById("rotation_x");
    var yRot = document.getElementById("rotation_y");
    var zRot = document.getElementById("rotation_z");
    var resetButton = document.getElementById("reset");


    resetButton.addEventListener("click", function() {
        resetButton.value = "true";
    });

    var xRotValueInDeg;
    var yRotValueInDeg;
    var zRotValueInDeg;
    var matrix;



    // --- 4. Animation loop ---
    function render(now) {
        gl.enable(gl.DEPTH_TEST);
        
        if (reset.value === "true") {
            console.log("Resetting rotations to 0");
            xRot.value = 0;
            yRot.value = 0;
            zRot.value = 0;
            reset.value = "false";
        }
        xRotValueInDeg = 160 + xRot.value*Math.PI/180;
        yRotValueInDeg = yRot.value*Math.PI/180;
        zRotValueInDeg = zRot.value*Math.PI/180;
        
        matrix = m4.projection(width, height, 400);
        matrix = m4.translate(matrix, width/2, height/2, 100);
        matrix = m4.xRotate(matrix, xRotValueInDeg);
        matrix = m4.yRotate(matrix, yRotValueInDeg);
        matrix = m4.zRotate(matrix, zRotValueInDeg);

        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
        gl.uniformMatrix4fv(rotationUniformLocation, false, matrix);

        // We still draw 12 vertices (unrolled from the HEDS)
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
