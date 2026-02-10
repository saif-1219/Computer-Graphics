// Vector operations functions

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

function displayMenu() {
    let menu = "Vector Operations Menu:\n";
    menu += "1. Tell whether the vectors are equal\n";
    menu += "2. Show the lengths of the vectors\n";
    menu += "3. Show the normalized vectors\n";
    menu += "4. Show the sum of the vectors\n";
    menu += "5. Show the difference of the vectors\n";
    menu += "6. Show the dot product of the vectors\n";
    menu += "7. Show the cross product of the vectors\n";
    menu += "8. Exit\n";
    return menu;
}

function main() {
    alert("Welcome to Vector Operations!");
    
    let dimension;
    while (true) {
        dimension = parseInt(prompt("Enter dimension (2, 3, or 4):"));
        if (dimension >= 2 && dimension <= 4) {
            break;
        }
        alert("Please enter a dimension between 2 and 4 inclusive.");
    }
    
    // Getting first vector
    alert("Enter first vector:");
    let vec1 = getVectorInput(dimension);
    if (vec1 === null) return;
    
    // Get second vector
    alert("Enter second vector:");
    let vec2 = getVectorInput(dimension);
    if (vec2 === null) return;
    
    alert("Vector 1: " + (vec1));
    alert("Vector 2: " + (vec2));
    
    // Main loop
    let running = true;
    while (running) {
        let choice = prompt("Vector Operations Menu:\n " +
            "1. Tell whether the vectors are equal\n" +
            "2. Show the lengths of the vectors\n" +
            "3. Show the normalized vectors\n" +
            "4. Show the sum of the vectors\n" +
            "5. Show the difference of the vectors\n" +
            "6. Show the dot product of the vectors\n" +
            "7. Show the cross product of the vectors\n" +
            "8. Exit\n" +
            "Enter your choice (1-8):");
        
        switch (choice) {
            case "1":
                if (vectorsEqual(vec1, vec2)) {
                    alert("The vectors are equal.");
                } else {
                    alert("The vectors are NOT equal.");
                }
                break;
                
            case "2":
                alert("Length of Vector 1: " + vectorLength(vec1));
                alert("Length of Vector 2: " + vectorLength(vec2));
                break;
                
            case "3":
                let norm1 = normalizeVector(vec1);
                let norm2 = normalizeVector(vec2);
                if (norm1 !== null) {
                    alert("Normalized Vector 1: " + (norm1));
                }
                if (norm2 !== null) {
                    alert("Normalized Vector 2: " + (norm2));
                }
                break;
                
            case "4":
                let sum = vectorSum(vec1, vec2);
                if (sum !== null) {
                    alert("Sum: " + (sum));
                }
                break;
                
            case "5":
                let diff = vectorDifference(vec1, vec2);
                if (diff !== null) {
                    alert("Difference (Vector 1 - Vector 2): " + (diff));
                }
                break;
                
            case "6":
                let dot = dotProduct(vec1, vec2);
                if (dot !== null) {
                    alert("Dot Product: " + dot);
                }
                break;
                
            case "7":
                if (dimension === 3) {
                    let cross = crossProduct(vec1, vec2);
                    if (cross !== null) {
                        alert("Cross Product: " + (cross));
                    }
                } else {
                    alert("Cross product only works with 3D vectors.");
                }
                break;
                
            case "8":
                alert("Thank you for using Vector Operations!");
                running = false;
                break;
                
            default:
                alert("Invalid choice. Please enter a number between 1 and 8.");
        }
    }
}

// Start the program when the page loads
window.onload = function() {
    main();
};
