'use strict';

importScripts("https://raw.githubusercontent.com/josephg/noisejs/master/perlin.js");

var max = -Infinity, min = Infinity;
var noisefn = noise.perlin3;

onmessage = function(e) {

    // one-dimensional array of RGBA pixels
    var data = [];

    for (var x = 0; x < e.data.width; x++) {
        for (var y = 0; y < e.data.height; y++) {

            var value = noisefn((x + e.data.x) / e.data.diffuse, (y + e.data.y) / e.data.diffuse, e.data.z);

            if (max < value) max = value;
            if (min > value) min = value;

            value = (1 + value) * 1.1 * 128;

            var cell = (x + y * e.data.width) * 4;
            data[cell] = data[cell + 1] = data[cell + 2] = value;
            data[cell + 3] = 255; // alpha.
        }
    }

    // console.log(e.data);
    postMessage( data );
}

