
'use strict'

var $$threads = [];

var Threaded  = (function( workerScript, poolSize ) {

    var self = {};
    var pub = {};

    // default to number of cores available
    pub.poolSize = poolSize = poolSize || navigator.hardwareConcurrency || 2;

    // queue of jobs
    self.queue = [];

    // result store
    self.results = [];

    // idle workers
    self.idle = [];

    // close old threds
    if ($$threads && $$threads.length)
        $$threads.forEach( t => t && t.worker && t.worker.terminate() )

    // all worker
    self.workers = $$threads = [...new Array(poolSize)].map(function(a,i) {
    
        var worker = {
            id: i,
            worker: new Worker( workerScript ),
            job: null
        }

        // when a worker responds with a message
        worker.worker.onmessage = function(e) {

            // save results
            self.results.push({
                input: worker.job.data,
                output: e.data
            });

            // keep moving
            worker.work();
        };

        // check for work
        worker.work = function() {

            if (self.queue.length) {

                // get next job
                worker.job = self.queue.pop();
                
                // process
                worker.worker.postMessage( worker.job.data );

            } else {

                // no work, go back to idle
                self.idle.push(worker);

                // check if all work is done
                self.done();
            }

        }

        // start idle
        self.idle.push( worker );

        return worker;

    }, this);

    // check if there is no work and no working threads
    self.done = function() {

        // if no queue and workers are idle, done
        if( !self.queue.length && self.workers.length == self.idle.length ) {

            // cleanup
            var r = self.results;
            self.results = [];

            // respond
            self.callback( r );
        }
    }

    // batches a bunch of jobs with a common callback
    pub.process = function(dataArray, callback) {

        if (self.queue.length)
            throw new Error("still processing");
        
        self.callback = callback;
        
        for (var i = 0; i < dataArray.length; i++) {
            self.queue.push({
                data: dataArray[i]
            });
        }

        while (self.queue.length && self.idle.length) {
            self.idle.pop().work();
        }
    }

    return pub;
});
