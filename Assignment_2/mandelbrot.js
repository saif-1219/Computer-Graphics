"use strict";

var vertexShaderSrc = `#version 300 es

in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

void main(){

    vec4 zeroToFour = a_position + vec4(2.0, 2.0, 0.0, 0.0);
    vec4 zeroToTwo = zeroToFour / vec4(2.0, 2.0, 1.0, 1.0);
    vec4 clipSpace = zeroToTwo - vec4(1.0, 1.0, 0.0, 0.0);
    
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    gl_PointSize = 1.0;

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

    
    var width = 600;
    var height = 600;
    
    document.getElementById("c").width = width;
    document.getElementById("c").height = height;

    let positions = [];
    let colors = [];

    for (let x = 0; x < width; x+=1){
        for (let y = 0; y < height; y+=1){
            let complex_x = map_point(0, width, -2, 2, x);
            let complex_y = map_point(0, height, -2, 2, y);
            positions.push(complex_x, complex_y);
            // colors.push(1, 0, 0, 1);

            let zx = 0;
            let zy = 0;
            let iteration = 0;
            const max_iteration = 500;
            while (Math.sqrt(zx * zx + zy * zy) < 2  && iteration < max_iteration) {
                let temp = zx * zx - zy * zy + complex_x;
                zy = 2 * zx * zy + complex_y;
                zx = temp;
                iteration++;
            }
            if (iteration === max_iteration) {
                colors.push(0.8, 0, 0.6, 1); 
            } else {
                colors.push(Math.sin(iteration/10), 0, 0, 1);
            }
        }
    }

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

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(colorAtribLocation);
    gl.vertexAttribPointer(colorAtribLocation, 4, gl.FLOAT, false, 0, 0);

    resizeCanvasToDisplaySize(gl.canvas);

    gl.useProgram(program);
    gl.bindVertexArray(vao);


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    var primitiveType = gl.POINTS; 
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
