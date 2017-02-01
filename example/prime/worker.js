'use strict';

importScripts("http://www.javascripter.net/faq/primefactors.txt");

onmessage = function(e) {
    // console.log(e.data);
    postMessage( e.data.map(function(x) {
        return {
            input: x,
            output: isPrime( x )
        }
    } ) );
}