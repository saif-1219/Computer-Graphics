function mandelbrotCalc(L, x, y) {

    var realPart = map_point(0, L - 1, -2, 2, x);
    var imagPart = map_point(0, L - 1, 2, -2, y);

    var webGLX = map_point(0, L - 1, -1, 1, x);
    var webGLY = map_point(0, L - 1, 1, -1, y);

    var complex = [realPart, imagPart];
    var webGL = [webGLX, webGLY, 0];

    console.log("Complex coordinates: Real Part =" + realPart + ", Imaginary Part = " + imagPart);
    console.log("WebGL coordinates: " + webGL);
}

function main() {
    var L = parseInt(prompt("Enter the dimension L of the square grid:"));
    var x = parseInt(prompt("Enter the x coordinate (0 to " + (L - 1) + "):"));
    var y = parseInt(prompt("Enter the y coordinate (0 to " + (L - 1) + "):"));
    mandelbrotCalc(L, x, y);
}

window.onload = main;
    
