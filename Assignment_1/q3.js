function lerp(P, Q, alpha) {
    let X = P*alpha + Q*(1 - alpha);
    return X;
}

function map_point(A, B, P, Q, X) {
    let alpha = (X - P) / (Q - P);
    let Y = lerp(A, B, alpha);
    return Y;
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