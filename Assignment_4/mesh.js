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

    var positionBuffer = gl.createBuffer();
    var colorBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();

    var width = 500;
    var height = 500;
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;

    var indexCount = 0;

    // Listen for file selection
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            const lines = text.split(/\r?\n/); // Split by any line ending

            let numVertices = 0;
            let numFaces = 0;
            let headerEnded = false;
            
            const vertices = [];
            const faces = [];
            let currentLineIndex = 0;

            // 1. Parse Header
            while (currentLineIndex < lines.length) {
                const line = lines[currentLineIndex].trim();
                const parts = line.split(/\s+/);
                
                if (parts[0] === 'element' && parts[1] === 'vertex') numVertices = parseInt(parts[2]);
                if (parts[0] === 'element' && parts[1] === 'face') numFaces = parseInt(parts[2]);
                
                if (line === 'end_header') {
                    headerEnded = true;
                    currentLineIndex++;
                    break;
                }
                currentLineIndex++;
            }

            // 2. Parse Vertices (x, y, z)
            for (let i = 0; i < numVertices; i++) {
                const parts = lines[currentLineIndex++].trim().split(/\s+/);
                // Storing as [x, y, z] - assumes they are the first 3 properties
                vertices.push([parseFloat(parts[0]) * 500, parseFloat(parts[1]) * -500, parseFloat(parts[2]) * 500]);
            }

            // 3. Parse Faces (indices)
            for (let i = 0; i < numFaces; i++) {
                const parts = lines[currentLineIndex++].trim().split(/\s+/);
                // PLY faces start with a count (e.g. '3' for triangle), followed by indices
                const vertexCount = parseInt(parts[0]);
                const indices = parts.slice(1, 1 + vertexCount).map(Number);
                faces.push(indices);
            }
            var flatFaces = faces.flat();
            indexCount = flatFaces.length; 

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatFaces), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            // Assigning a default color (red) to all vertices
            const defaultColors = [];
            for (let i = 0; i < vertices.length; i++) {
                defaultColors.push(Math.random(), Math.random(),Math.random(), 1); 
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(defaultColors), gl.STATIC_DRAW);
        };

        reader.readAsText(file);
    });


    var positions = [0, 0, 0,
                     50, 0, 0,
                     0, 50, 0,
                     50, 50, 0];

    var indices = [0, 1, 2,
                   1, 2, 3];

    var colors = [0, 0, 0, 1,
              0, 0, 0, 1,
              0, 0, 0, 1,
              0, 0, 0, 1];

    indexCount = indices.length;

    var vertexCount = positions.length/3;

    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    gl.enableVertexAttribArray(positionAtribLocation);
    gl.vertexAttribPointer(positionAtribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    var xRotValueInDeg = 0;
    var yRotValueInDeg = 0;
    var zRotValueInDeg = 0;
    
    // Translation variables
    var translationX = 0;
    var translationY = 0;
    var translationZ = 0;
    
    // Scale variables
    var scaleX = 1;
    var scaleY = 1;
    var scaleZ = 1;
    
    // Reflection variables (boolean flags)
    var reflectX = false;
    var reflectY = false;
    var reflectZ = false;
    
    // Shear variables
    var shearXY = 0;  // shear X by Y
    var shearXZ = 0;  // shear X by Z
    var shearYZ = 0;  // shear Y by Z
    
    var matrix;
    var rotationSpeed = 2;
    var translationSpeed = 5;
    var scaleSpeed = 0.05;
    var shearSpeed = 0.05;


    document.addEventListener("keydown", keyDownHandler);



    function keyDownHandler(event) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
            event.preventDefault();
        }

        switch (event.code) {
            // Rotation around axes 
            case "KeyQ": xRotValueInDeg += rotationSpeed; break;  // X rotation counter-clockwise
            case "KeyW": xRotValueInDeg -= rotationSpeed; break;  // X rotation clockwise
            case "KeyA": yRotValueInDeg += rotationSpeed; break;  // Y rotation counter-clockwise
            case "KeyS": yRotValueInDeg -= rotationSpeed; break;  // Y rotation clockwise
            case "KeyZ": zRotValueInDeg += rotationSpeed; break;  // Z rotation counter-clockwise
            case "KeyX": zRotValueInDeg -= rotationSpeed; break;  // Z rotation clockwise
            
            //  Translation along axes 
            case "ArrowLeft": translationX -= translationSpeed; break;   // Move left (negative X)
            case "ArrowRight": translationX += translationSpeed; break;  // Move right (positive X)
            case "ArrowUp": translationY -= translationSpeed; break;     // Move up (positive Y)
            case "ArrowDown": translationY += translationSpeed; break;   // Move down (negative Y)
            case "KeyO": translationZ += translationSpeed; break;        // Move forward (positive Z)
            case "KeyP": translationZ -= translationSpeed; break;        // Move backward (negative Z)
            
            // Scaling along axes 
            case "KeyE": scaleX += scaleSpeed; break;  // Grow X
            case "KeyR": scaleX -= scaleSpeed; break;  // Shrink X (was used for clearing, now repurposed)
            case "KeyD": scaleY += scaleSpeed; break;  // Grow Y
            case "KeyF": scaleY -= scaleSpeed; break;  // Shrink Y
            case "KeyC": scaleZ += scaleSpeed; break;  // Grow Z
            case "KeyV": scaleZ -= scaleSpeed; break;  // Shrink Z
            
            // Reflection about axes 
            case "Digit1": reflectX = !reflectX; break;  // Toggle X reflection
            case "Digit2": reflectY = !reflectY; break;  // Toggle Y reflection
            case "Digit3": reflectZ = !reflectZ; break;  // Toggle Z reflection
            
            // Shear along axes 
            case "Comma": shearXY -= shearSpeed; break;   // Shear X by Y (negative)
            case "Period": shearXY += shearSpeed; break;  // Shear X by Y (positive)
            case "Slash": shearXZ -= shearSpeed; break;   // Shear X by Z (negative)
            case "BracketRight": shearXZ += shearSpeed; break; // Shear X by Z (positive)
            case "KeyL": shearYZ -= shearSpeed; break;    // Shear Y by Z (negative)
            case "Semicolon": shearYZ += shearSpeed; break; // Shear Y by Z (positive)
            
            // Reset all transformations 
            case "KeyM": 
                xRotValueInDeg = 0;
                yRotValueInDeg = 0;
                zRotValueInDeg = 0;
                translationX = 0;
                translationY = 0;
                translationZ = 0;
                scaleX = 1;
                scaleY = 1;
                scaleZ = 1;
                reflectX = false;
                reflectY = false;
                reflectZ = false;
                shearXY = 0;
                shearXZ = 0;
                shearYZ = 0;
                console.log("All transformations reset!");
                break;
        }
    }


    // Animation loop 
    function render(now) {
        gl.enable(gl.DEPTH_TEST);
        
        matrix = m4.projection(width, height, 400);
        matrix = m4.translate(matrix, width/2, height/2, 100);
        
        // Apply translation
        matrix = m4.translate(matrix, translationX, translationY, translationZ);
        
        // Apply rotation
        matrix = m4.xRotate(matrix, xRotValueInDeg * Math.PI / 180);
        matrix = m4.yRotate(matrix, yRotValueInDeg * Math.PI / 180);
        matrix = m4.zRotate(matrix, zRotValueInDeg * Math.PI / 180);
        
        // Apply scaling
        matrix = m4.scale(matrix, scaleX, scaleY, scaleZ);
        
        // Apply reflection if enabled
        if (reflectX) matrix = m4.reflect(matrix, 'X');
        if (reflectY) matrix = m4.reflect(matrix, 'Y');
        if (reflectZ) matrix = m4.reflect(matrix, 'Z');
        
        // Apply shear transformations
        if (shearXY !== 0) matrix = m4.applyShear(matrix, 'XY', shearXY);
        if (shearXZ !== 0) matrix = m4.applyShear(matrix, 'XZ', shearXZ);
        if (shearYZ !== 0) matrix = m4.applyShear(matrix, 'YZ', shearYZ);

        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
        gl.uniformMatrix4fv(rotationUniformLocation, false, matrix);

        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
