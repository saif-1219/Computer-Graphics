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
