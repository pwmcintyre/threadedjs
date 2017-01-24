'use strict';

importScripts("http://www.javascripter.net/faq/primefactors.txt");

onmessage = function(e) {
    postMessage( isPrime( e.data ) );
}