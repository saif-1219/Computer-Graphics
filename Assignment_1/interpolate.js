function interpolate(W, x){
    webGL_coordinate_X = map_point(0, W-1, -1, 1, x);
    webGL_coordinate = vec3(webGL_coordinate_X, 0, 0);

    black = vec3(0, 0, 0);
    white = vec3(1, 1, 1);

    gray_shade = map_point(0, W-1, black, white, x);

    var red = vec3(1, 0, 0);
    var green = vec3(0, 1, 0);
    var blue = vec3(0, 0, 1);
    
    var center = (W - 1) / 2;
    var rgbColor;

    if (x <= center) {
        rgbColor = map_point(0, center, red, green, x);
    } else {
        rgbColor = map_point(center, W - 1, green, blue, x);
    }
    
    console.log("WebGL Coordinate:", webGL_coordinate);
    console.log("Gray Shade:", gray_shade);
    console.log("RGB Color:", rgbColor);
}

function main() {
    let W = parseInt(prompt("Enter the width (W):"));
    let x = parseInt(prompt("Enter the position (x) between 0 and " + (W - 1) + ":"));
    interpolate(W, x);
}

window.onload = main;
