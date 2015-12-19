var util = require('util');
var EventEmitter = require('events');

/**
 * @class Creates a new Handoff instance.
 * @classdesc A Handoff is a work queue which.
 * It can be fed with new work, which is then
 * worked off one-after-another.
 *
 * This is particularly useful if you have a unique resource
 * or code which is not reentrant.
 *
 */
var Handoff = function() {
    this.queue = [];
    this.id = 0;
    this.stopped = false;
    this.waiting = false;
};

/**
 * A synchronous work callback.
 * @callback Handoff~syncWorkCallback
 * @throws {*} Is free to throw any exception.
 *
 */

/**
 * A asynchronous work callback.
 * @callback Handoff~asyncWorkCallback
 * @param {function} done The classic node done callback `done(err, result)`
 * @throws {*} Is free to throw any exception
 *
 */

Handoff.prototype.next = function() {
    this.queue.shift();
    if (!this.stopped && this.queue.length > 0) {
        this.queue[0]();
    }
};

/**
 * Enqueue async work.
 *
 * @function
 * @param {Handoff~asyncWorkCallback} work The work function to queue.
 * @return {number} An ordered id telling the `work`'s positon in the work queue
 * @fires Handoff#done
 *
 */
Handoff.prototype.enqueue = function(work) {
    var self = this;
    var id = this.id++;
    this.queue.push(function() {
        try {
            self.waiting = true;
            work(function(err, result) {
                self.waiting = false;
                /**
                 * Done event. A work item has finished either with success or with error.
                 *
                 * @event Handoff#done
                 * @type {object}
                 * @property {number} id - The id for the specific work item returned by {@link Handoff~enqueue}
                 * @property {*} [error] - In case of error, this holds the error object/value. 
                 * @property {*} [result] - In case of success if `done` was called with result.
                 *
                 */
                self.emit('done', {
                    id: id,
                    error: err,
                    result: result
                });
                self.next();
            });
        } catch (err) {
            self.emit('done', {
                id: id,
                error: err
            });
            sel.next();
        }
    });
    if (self.stopped === false && self.queue.length === 1) {
        self.queue[0]();
    }
};


/**
 * Stop working off the queue.
 */
Handoff.prototype.stop = function() {
    this.stopped = true;
};

/**
 * Resume working off the queue.
 */
Handoff.prototype.resume = function() {
    this.stopped = false;
    if (this.waiting === false && this.queue.length > 0) {
        this.queue[0]();
    };
};