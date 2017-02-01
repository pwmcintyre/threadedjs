
'use strict'

var $$threads = [];

var Threaded  = (function( workerScript, poolSize ) {

    var self = {};
    var pub = {};

    // default to number of cores available
    pub.poolSize = parseInt( poolSize = poolSize || navigator.hardwareConcurrency || 2);

    // queue of jobs
    self.queue = [];

    // result store
    self.results = [];

    // idle workers
    self.idle = [];

    // close old threds
    if ($$threads && $$threads.length)
        $$threads.forEach( t => t && t.worker && t.worker.terminate() )

    // create workers
    $$threads = self.workers = [...new Array( pub.poolSize )];
    self.workers.forEach(function(worker, index, array) {
    
        var worker = array[index] = {
            id: index,
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

                self.progress()

            } else {

                // no work, go back to idle
                self.idle.push(worker);

                // check if all work is done
                self.done();
            }

        }

        // start idle
        self.idle.push( worker );

        // return worker;

    }, this);

    //
    self.progress = function () {
        
        if (!self.progresscb)
            return;

        self.progresscb( 1 - (self.queue.length / self.queue.originallength ) );
    }

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
    pub.process = function(dataArray, callback, progresscb) {

        if (self.queue.length)
            throw new Error("still processing");
        
        self.callback = callback;
        self.progresscb = progresscb;
        
        for (var i = 0; i < dataArray.length; i++) {
            self.queue.push({
                data: dataArray[i]
            });
        }

        self.queue.originallength = self.queue.length;

        self.progress();
        
        while (self.queue.length && self.idle.length) {
            self.idle.pop().work();
        }
    }

    return pub;
});
