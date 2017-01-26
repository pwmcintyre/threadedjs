
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
    self.workers = new Array(poolSize);
    $$threads = self.workers;

    for (var i = 0; i < poolSize; i++) {
    
        var me = {
            id: i,
            worker: new Worker( workerScript ),
            job: null
        }

        self.workers[i] = me;

        // when a worker responds with a message
        me.worker.onmessage = function(e) {
console.log('returned', me.id);
            // save results
            self.results.push({
                input: me.job.data,
                output: e.data
            });

            // keep moving
            me.work();
        };

        // check for work
        me.work = function() {

            if (self.queue.length) {

                // get next job
                me.job = self.queue.pop();
                
                // process
                me.worker.postMessage( me.job.data );

            } else {

                // no work, go back to idle
                self.idle.push(me);

                // check if all work is done
                self.done();
            }

        }

        // start idle
        self.idle.push( me );

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
