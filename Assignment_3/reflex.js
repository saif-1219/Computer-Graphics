"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;        // combined transform + projection
out vec4 v_color;

void main(){
    // apply our 4x4 matrix to the input position
    gl_Position = u_matrix * a_position;
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

    // random transform parameters and bounding box for hit testing
    var currentTransform = identity();
    var currentBBox = {minX:0, maxX:0, minY:0, maxY:0};
    var shapeVertices = [];    // current shape's local coordinates
    var currentColor = [1,0,0,1];

    function computeBBoxFromVertices(mat, verts) {
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var i = 0; i < verts.length; i += 2) {
            var x = verts[i], y = verts[i+1];
            var tx = mat[0] * x + mat[4] * y + mat[12];
            var ty = mat[1] * x + mat[5] * y + mat[13];
            minX = Math.min(minX, tx);
            minY = Math.min(minY, ty);
            maxX = Math.max(maxX, tx);
            maxY = Math.max(maxY, ty);
        }
        currentBBox.minX = minX;
        currentBBox.maxX = maxX;
        currentBBox.minY = minY;
        currentBBox.maxY = maxY;
    }

    function getRandomTransform() {
        // choose shape type randomly (1 = quad, 2 = tri)
        if (Math.random() < 0.5) {
            // square
            shapeVertices = [
                -25, -25,
                -25,  25,
                 25, -25,
                -25,  25,
                 25, -25,
                 25,  25
            ];
        } else {
            // triangle
            shapeVertices = [
                -25, -25,
                 25, -25,
                  0,  25
            ];
        }

        // picking random color
        currentColor = [Math.random(), Math.random(), Math.random(), 1.0];
        positions = shapeVertices.slice();
        colors = [];
        for (var i = 0; i < positions.length / 2; ++i) {
            colors.push(currentColor[0], currentColor[1], currentColor[2], currentColor[3]);
        }

        // random transform parameters
        var tx = Math.random() * (width - 50) + 25;
        var ty = Math.random() * (height - 50) + 25;
        var rotateX = Math.random() * Math.PI * 2;
        var rotateY = Math.random() * Math.PI * 2;
        var sx = Math.random() + 0.5; // .5 to 1.5
        var sy = Math.random() + 0.5;
        var shx = (Math.random() - 0.5);
        var shy = (Math.random() - 0.5);
        var reflectX = Math.random() < 0.5 ? -1 : 1;
        var reflectY = Math.random() < 0.5 ? -1 : 1;
        
        // build matrix
        var mat = identity();
        mat = multiply(mat, translation(tx, ty));
        mat = multiply(mat, rotation(rotateX));
        mat = multiply(mat, rotation(rotateY));
        mat = multiply(mat, scale(sx * reflectX, sy * reflectY));
        mat = multiply(mat, shear(shx, shy));

        currentTransform = mat;
        computeBBoxFromVertices(mat, shapeVertices);

        lastAppearanceTime = Date.now();
        shapeVisible = true;
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

    var time = 30;
    var score = 0;
    var baseAppear = 1;
    var appearTime = baseAppear;
    var missedClicks = 0;
    var startTime = Date.now();
    var timeLeft = time;
    
    var gameOverPositions = [
        150, 200,
        150, 300,
        350, 200,
        150, 300,
        350, 200,
        350, 300
    ];

    var gameOverColors = [
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0
    ];

    // static square geometry centered at origin (50×50)
    var colors = [
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0,
        1.0, 0, 0, 1.0
    ];
    var positions = [
        -25, -25,
        -25,  25,
         25, -25,
        -25,  25,
         25, -25,
         25,  25
    ];
    
    // Variables for random shape
    var shapeVisible = true;
    var lastAppearanceTime = Date.now();
    
    // uniform location for matrix
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var projectionMatrix = makeProjection(width, height);

    // initialize first random transform and hook up UI
    getRandomTransform();
    var scoreEl = document.getElementById("score");
    var timerEl = document.getElementById("timer");
    var restartBtn = document.getElementById("restart");
    restartBtn.addEventListener("click", function() {
        score = 0;
        missedClicks = 0;
        gameOver = false;
        finalScore = 0;
        scoreEl.innerText = "Score: 0";
        startTime = Date.now();
        timeLeft = time;
        timerEl.innerText = "Time: " + timeLeft.toFixed(0);
        lastAppearanceTime = Date.now();
        shapeVisible = true;
        getRandomTransform();
    });

    // click handler for canvas points uses bounding box computed from transform
    canvas.addEventListener("mousedown", function(event) {
        if (score < 0) return; // ignore clicks after game over
        const mousePos = getMousePos(canvas, event);
        if (shapeVisible) {
            if (mousePos.x >= currentBBox.minX && mousePos.x <= currentBBox.maxX &&
                mousePos.y >= currentBBox.minY && mousePos.y <= currentBBox.maxY) {
                score++;
                shapeVisible = false; // hide until next appearance
                missedClicks = 0; // reset consecutive miss counter
            } else {
                score--;
            }
        }
    });

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


    function render() {
        // update countdown timer
        var currentTime = Date.now();
        timeLeft = time - (currentTime - startTime) / 1000;
        if (timeLeft <= 0 && !gameOver) {
            // time expired, record final score before negating
            finalScore = score;
            score = -1; // trigger game over
            gameOver = true;
        }
        timerEl.innerText = "Time: " + timeLeft.toFixed(0);

        // adjust appearTime based on current score
        appearTime = baseAppear - score * 0.1;
        if (appearTime < 0.2) appearTime = 0.2;
        if (appearTime > 5) appearTime = 5;

        // check for timing
        if (score >= 0) {
            var elapsedTime = (currentTime - lastAppearanceTime) / 1000;
            if (elapsedTime > appearTime) {
                // the shape timed out without being clicked
                if (shapeVisible) {
                    missedClicks++;
                    if (missedClicks >= 3) {
                        score--;
                        missedClicks = 0;
                    }
                }
                shapeVisible = false;
                getRandomTransform();
            }
        }
        if (score < 0) {
   
            var shown = gameOver ? finalScore : 0;
            scoreEl.innerText = "Gameover, score: " + shown + ", press the restart button";
        } else {
            scoreEl.innerText = "Score: " + score;
        }

        // prepare buffers depending on state
        if (score >= 0) {
            if (shapeVisible) {
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
            } else {
                
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([]), gl.STATIC_DRAW);
            }
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gameOverPositions), gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gameOverColors), gl.DYNAMIC_DRAW);
        }

        // compute matrix and upload
        var matrixToUse = identity();
        if (score >= 0 && shapeVisible) {
            matrixToUse = multiply(projectionMatrix, currentTransform);
        } else {
            matrixToUse = multiply(projectionMatrix, identity());
        }
        gl.uniformMatrix4fv(matrixLocation, false, matrixToUse);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var count = positions.length / 2;
        gl.drawArrays(gl.TRIANGLES, 0, count);

        requestAnimationFrame(render);
    }

    render();
}

main();


// Helper functions

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect(); 
    return {
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top  
    };
}

function identity() {
    return new Float32Array([
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ]);
}

function multiply(a, b) {
    var out = new Float32Array(16);
    for (var i = 0; i < 4; ++i) {
        for (var j = 0; j < 4; ++j) {
            var sum = 0;
            for (var k = 0; k < 4; ++k) {
                sum += a[k * 4 + i] * b[j * 4 + k];
            }
            out[j * 4 + i] = sum;
        }
    }
    return out;
}

function translation(tx, ty) {
    var m = identity();
    m[12] = tx;
    m[13] = ty;
    return m;
}

function rotation(angle) {
    var c = Math.cos(angle);
    var s = Math.sin(angle);
    var m = identity();
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return m;
}

function scale(sx, sy) {
    var m = identity();
    m[0] = sx;
    m[5] = sy;
    return m;
}

function shear(shx, shy) {
    var m = identity();
    // x' = x + shx*y, y' = y + shy*x
    m[4] = shx;
    m[1] = shy;
    return m;
}

function makeProjection(w, h) {
    // converts from pixel coordinates to clip space
    var m = identity();
    m[0] = 2 / w;
    m[5] = -2 / h;
    m[12] = -1;
    m[13] = 1;
    return m;
}


