function vec2(...args) {
    if (arguments.length != 2) {
        console.error('vec2: Invalid number of arguments');
        return;
    }
    return [args[0], args[1]];
}

function vec3(...args) {
    if (arguments.length != 3) {
        console.error('vec3: Invalid number of arguments');
        return;
    }
    return [args[0], args[1], args[2]];
}

function vec4(...args){
    if (arguments.length != 4) {
        console.error('vec4: Invalid number of arguments');
        return;
    }
    return [args[0], args[1], args[2], args[3]];
}

function mat2(...args) {
    if (args.length != 4) {
        console.error('mat2: Invalid number of arguments');
        return;
    }
    return [
        [args[0], args[1]],
        [args[2], args[3]]
    ];
}

function mat3(...args) {
    if (args.length != 9) {
        console.error('mat3: Invalid number of arguments');
        return;
    }
    return [
        [args[0], args[1], args[2]],
        [args[3], args[4], args[5]],
        [args[6], args[7], args[8]]
    ];
}

function mat4(...args) {
    if (args.length != 16) {
        console.error('mat4: Invalid number of arguments');
        return;
    }
    return [
        [args[0], args[1], args[2], args[3]],
        [args[4], args[5], args[6], args[7]],
        [args[8], args[9], args[10], args[11]],
        [args[12], args[13], args[14], args[15]]
    ];
}

function vectorLength(vec) {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
        sum += vec[i] * vec[i];
    }
    return Math.sqrt(sum);
}

function normalizeVector(vec) {
    let length = vectorLength(vec);
    if (length === 0) {
        alert("Cannot normalize zero vector");
        return null;
    }
    let normalized = [];
    for (let i = 0; i < vec.length; i++) {
        normalized[i] = vec[i] / length;
    }
    return normalized;
}

function vectorSum(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        alert("Vectors must have the same dimension");
        return null;
    }
    let sum = [];
    for (let i = 0; i < vec1.length; i++) {
        sum[i] = vec1[i] + vec2[i];
    }
    return sum;
}

function vectorDifference(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        alert("Vectors must have the same dimension");
        return null;
    }
    let diff = [];
    for (let i = 0; i < vec1.length; i++) {
        diff[i] = vec1[i] - vec2[i];
    }
    return diff;
}

function dotProduct(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        alert("Vectors must have the same dimension");
        return null;
    }
    let dot = 0;
    for (let i = 0; i < vec1.length; i++) {
        dot += vec1[i] * vec2[i];
    }
    return dot;
}

function crossProduct(vec1, vec2) {
    if (vec1.length !== 3 || vec2.length !== 3) {
        alert("Cross product only works with 3D vectors");
        return null;
    }
    let cross = [
        vec1[1] * vec2[2] - vec1[2] * vec2[1],
        vec1[2] * vec2[0] - vec1[0] * vec2[2],
        vec1[0] * vec2[1] - vec1[1] * vec2[0]
    ];
    return cross;
}

function vectorsEqual(vec1, vec2) {
    if (vec1.length !== vec2.length) {
        return false;
    }
    for (let i = 0; i < vec1.length; i++) {
        if (vec1[i] !== vec2[i]) {
            return false;
        }
    }
    return true;
}

function getVectorInput(dimension) {
    let vec = [];
    for (let i = 0; i < dimension; i++) {
        let component = parseFloat(prompt(`Enter component ${i + 1}:`));
        if (isNaN(component)) {
            alert("Invalid input. Please enter a number.");
            return null;
        }
        vec[i] = component;
    }

    // using the vec constructors from common.js from q1
    if (dimension === 2) {
        vec = vec2(...vec);
    } else if (dimension === 3) {
        vec = vec3(...vec);
    } else if (dimension === 4) {
        vec = vec4(...vec);
    }

    return vec;
}

function lerp(P, Q, alpha) {
    if (typeof P === 'number' && typeof Q === 'number') {
        return Q * alpha + P * (1 - alpha);
    }

    if (Array.isArray(P) && Array.isArray(Q)) {
        if (P.length !== Q.length) {
            console.log("Vectors must be of same dimension for interpolation");
            return;
        }
        var result = [];
        for (var i = 0; i < P.length; i++) {
            result.push(Q[i] * alpha + P[i] * (1 - alpha));
        }
        return result;
    }
    
    console.log("Invalid type for lerp")
    return;
}


function map_point(P, Q, A, B, X) {
    if (P === Q) return A; 
    var alpha = (X - P) / (Q - P);
    
    return lerp(A, B, alpha);
}
