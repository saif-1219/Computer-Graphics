"use strict";

const FILENAMES = [
    'solids/tetrahedron.ply',
    'solids/cube.ply',
    'solids/octahedron.ply',
    'solids/dodecahedron.ply',
    'solids/icosahedron.ply'
];

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
uniform bool u_isWireframe;

void main(){
    if (u_isWireframe) {
        outColor = vec4(0.0, 0.0, 0.0, 1.0); // Black for wireframe lines
    } else {
        outColor = v_color;
    }
}
`;

function createShader(gl, type, src){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return undefined;
}

let gl, program;
let positionAtribLocation, colorAtribLocation;
let rotationUniformLocation, isWireframeUniformLocation;
let vao, positionBuffer, colorBuffer, solidIndexBuffer, lineIndexBuffer;

let solidIndexCount = 0;
let lineIndexCount = 0;

let currentSolidIndex = 0;
let isDualMode = false;
let isWireframeMode = false;

let originalMesh = null;
let dualMesh = null;


async function loadSolid(index) {
    try {
        const response = await fetch(FILENAMES[index]);
        if (!response.ok) throw new Error(`Failed to load ${FILENAMES[index]}`);
        const text = await response.text();
        
        originalMesh = parsePLY(text);
        dualMesh = computeDual(originalMesh);
        
        updateBuffers();
    } catch (err) {
        console.error("Error loading PLY. Are you running a local web server?", err);
    }
}

function parsePLY(text) {
    const lines = text.split(/\r?\n/);
    let numVertices = 0, numFaces = 0;
    let currentLineIndex = 0;
    
    while (currentLineIndex < lines.length) {
        const line = lines[currentLineIndex].trim();
        const parts = line.split(/\s+/);
        if (parts[0] === 'element' && parts[1] === 'vertex') numVertices = parseInt(parts[2]);
        if (parts[0] === 'element' && parts[1] === 'face') numFaces = parseInt(parts[2]);
        currentLineIndex++;
        if (line === 'end_header') break;
    }

    const vertices = [];
    for (let i = 0; i < numVertices; i++) {
        const parts = lines[currentLineIndex++].trim().split(/\s+/);
        vertices.push([parseFloat(parts[0]) * 100, parseFloat(parts[1]) * -100, parseFloat(parts[2]) * 100]);
    }

    const faces = [];
    for (let i = 0; i < numFaces; i++) {
        const parts = lines[currentLineIndex++].trim().split(/\s+/);
        if (parts.length < 1) continue;
        const vertexCount = parseInt(parts[0]);

        faces.push(parts.slice(1, 1 + vertexCount).map(Number)); 
    }
    
    return { vertices, faces };
}

function computeDual(mesh) {
    // 1. Centroids of original faces become the new vertices
    const dualVertices = mesh.faces.map(face => 
        {
        let cx = 0, cy = 0, cz = 0;
        for (let vIdx of face) {
            cx += mesh.vertices[vIdx][0];
            cy += mesh.vertices[vIdx][1];
            cz += mesh.vertices[vIdx][2];
        }
        return [cx / face.length, cy / face.length, cz / face.length];
        }
    );

    // 2. Original vertices become the new faces
    const dualFaces = [];
    for (let v = 0; v < mesh.vertices.length; v++) {
        // Find all faces sharing this vertex
        let facesWithV = [];
        for (let f = 0; f < mesh.faces.length; f++) {
            if (mesh.faces[f].includes(v)) facesWithV.push(f);
        }
        
        // Sort the faces in circular order around the vertex
        let orderedDualFace = [];
        let currentF = facesWithV[0];
        orderedDualFace.push(currentF);
        let unvisitedFaces = new Set(facesWithV.slice(1));
        
        while(unvisitedFaces.size > 0) {
            let foundNext = false;
            for (let nextF of unvisitedFaces) {
                // Adjacent faces share exactly 2 vertices (an edge)
                let sharedVerts = mesh.faces[currentF].filter(vert => mesh.faces[nextF].includes(vert));
                if (sharedVerts.includes(v) && sharedVerts.length >= 2) {
                    orderedDualFace.push(nextF);
                    currentF = nextF;
                    unvisitedFaces.delete(nextF);
                    foundNext = true;
                    break;
                }
            }
            if (!foundNext) break; // Safety fallback
        }
        dualFaces.push(orderedDualFace);
    }

    return { vertices: dualVertices, faces: dualFaces };
}

function updateBuffers() {
    if (!originalMesh) return;
    const mesh = isDualMode ? dualMesh : originalMesh;
    
    let drawPositions = [];
    let drawColors = [];
    let solidIndices = [];
    let lineIndices = [];
    let currentVertex = 0;

    // Flatten vertices into distinct faces for flat coloring and easy wireframes
    for (let f = 0; f < mesh.faces.length; f++) {
        let face = mesh.faces[f];
        let faceColor = [Math.random(), Math.random(), Math.random(), 1];
        let startIndex = currentVertex;

        for (let i = 0; i < face.length; i++) {
            let vIdx = face[i];
            drawPositions.push(...mesh.vertices[vIdx]);
            drawColors.push(...faceColor);
            
            // Map the edges for the wireframe index buffer
            let nextI = (i + 1) % face.length;
            lineIndices.push(startIndex + i, startIndex + nextI);
            currentVertex++;
        }

        // Triangulate the N-gon for solid rendering
        for (let i = 1; i < face.length - 1; i++) {
            solidIndices.push(startIndex, startIndex + i, startIndex + i + 1);
        }
    }

    solidIndexCount = solidIndices.length;
    lineIndexCount = lineIndices.length;

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(drawPositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAtribLocation);
    gl.vertexAttribPointer(positionAtribLocation, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(drawColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(solidIndices), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(lineIndices), gl.STATIC_DRAW);
}

// --- Initialization and Render ---

function main(){
    var canvas = document.querySelector("#c");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl = canvas.getContext("webgl2");
    if (!gl) return;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    program = createProgram(gl, vertexShader, fragmentShader);

    positionAtribLocation = gl.getAttribLocation(program, "a_position");
    colorAtribLocation = gl.getAttribLocation(program, "a_color");
    rotationUniformLocation = gl.getUniformLocation(program, "u_matrix");
    isWireframeUniformLocation = gl.getUniformLocation(program, "u_isWireframe");

    vao = gl.createVertexArray();
    positionBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();
    solidIndexBuffer = gl.createBuffer();
    lineIndexBuffer = gl.createBuffer();

    // Setup input listeners
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key >= '1' && key <= '5') {
            currentSolidIndex = parseInt(key) - 1;
            isDualMode = false; 
            loadSolid(currentSolidIndex);
        } else if (key === 'd') {
            isDualMode = !isDualMode;
            updateBuffers();
        } else if (key === 'w') {
            isWireframeMode = !isWireframeMode;
        }
    });

    loadSolid(0);

    requestAnimationFrame(render);

    function render(now) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.2, 0.2, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        if (solidIndexCount > 0) {
            gl.useProgram(program);
            gl.bindVertexArray(vao);
            
            // Set up a basic spin animation and apply the user's scale
            let matrix = m4.projection(gl.canvas.width, gl.canvas.height, 600);
            matrix = m4.translate(matrix, gl.canvas.width/2, gl.canvas.height/2, 100);
            
            let scale = parseFloat(document.getElementById('scaleSlider').value);
            matrix = m4.scale(matrix, scale, scale, scale);
            
            // Spin slowly over time
            matrix = m4.yRotate(matrix, now * 0.001);
            matrix = m4.xRotate(matrix, now * 0.0005);
            
            gl.uniformMatrix4fv(rotationUniformLocation, false, matrix);

  
            if (isWireframeMode) {
                // Draw ONLY the wireframe (black lines)
                gl.uniform1i(isWireframeUniformLocation, 1);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
                gl.drawElements(gl.LINES, lineIndexCount, gl.UNSIGNED_SHORT, 0);
            } else {
                // Draw ONLY the solid faces (colored triangles)
                gl.uniform1i(isWireframeUniformLocation, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, solidIndexBuffer);
                gl.drawElements(gl.TRIANGLES, solidIndexCount, gl.UNSIGNED_SHORT, 0);
            }
        }
        requestAnimationFrame(render);
    }
}

main();