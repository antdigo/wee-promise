/*! wee-promise - 1.0.6 - Bernard McManus - 4a1cdaa - 2016-10-25 */

(function(global,UNDEFINED) {
"use strict";

function Stack() {
	var that = this;
	that.q = [];
	that.i = 0;
	that.len = 0;
}

Stack.prototype.put = function(element) {
	var that = this;
	that.q[that.len] = element;
	that.len++;
};

Stack.prototype.get = function() {
	var that = this,
		element = that.q[that.i];
	that.i++;
	if (that.i >= that.len) {
		that.q.length = that.i = that.len = 0;
	}
	return element;
};

var asyncProvider;

if (global.setImmediate) {
	asyncProvider = setImmediate;
} else if (global.MessageChannel) {
	asyncProvider = (function() {
		var stack = new Stack(),
			channel = new MessageChannel();
		channel.port1.onmessage = function() {
			/* jshint -W084 */
			var fn;
			while (fn = stack.get()) {
				fn();
			}
		};
		return function(cb) {
			stack.put(cb);
			channel.port2.postMessage(0);
		};
	}());
} else {
	asyncProvider = setTimeout;
}

WeePromise.async = function(cb) {
	asyncProvider(cb);
};


var PENDING = 0;
var RESOLVED = 1;
var REJECTED = 2;

function WeePromise(resolver) {
	var that = this;
	var one = getSingleCallable(function(action, value) {
		action(that, value);
	});

	that._state = PENDING;
	that._stack = new Stack();
	that.resolve = function(value) {
		one($resolve, value);
		return that;
	};
	that.reject = function(reason) {
		one($reject, reason);
		return that;
	};

	if (resolver) {
		try {
			resolver(that.resolve, that.reject);
		}
		catch(err) {
			that.reject(err);
		}
	}
}

WeePromise.prototype.onresolved = function(value) {
	return value;
};

WeePromise.prototype.onrejected = function(reason) {
	throw reason;
};

WeePromise.prototype._flush = function() {
	var that = this;
	var state = that._state;

	if (state) {
		WeePromise.async(function() {
			(function flush() {
				var promise = that._stack.get();
				if (promise) {
					var fn = (state === RESOLVED ? promise.onresolved : promise.onrejected);
					try {
						$resolve(promise, fn(that._value));
					}
					catch(err) {
						$reject(promise, err);
					}
					flush();
				}
			}());
		});
	}
};

WeePromise.prototype.then = function(onresolved, onrejected) {
	var that = this;
	var promise = new WeePromise();

	if (isFunction(onresolved)) {
		promise.onresolved = onresolved;
	}
	if (isFunction(onrejected)) {
		promise.onrejected = onrejected;
	}

	that._stack.put(promise);
	that._flush();
	return promise;
};

WeePromise.prototype.catch = function(onrejected) {
	return this.then(UNDEFINED, onrejected);
};

WeePromise.resolve = function(result) {
	return new WeePromise().resolve(result);
};

WeePromise.reject = function(reason) {
	return new WeePromise().reject(reason);
};

WeePromise.all = function(collection) {
	var promise = new WeePromise();
	var result = [];
	var got = 0;
	var need = collection.length;

	collection.forEach(function(child, i) {
		unwrap(child, function(state, value) {
			got++;
			result[i] = value;
			if (state === REJECTED) {
				promise.reject(value);
			} else if (got === need) {
				promise.resolve(result);
			}
		});
	});

	return promise;
};

WeePromise.race = function(collection) {
	var promise = new WeePromise();
	collection.forEach(function(child) {
		unwrap(child, function(state, value) {
			setState(promise, state, value);
		});
	});
	return promise;
};

function $resolve(context, value) {
	if (value === context) {
		$reject(context, new TypeError('A promise cannot be resolved with itself.'));
	} else {
		unwrap(value, function(state, value) {
			setState(context, state, value);
		});
	}
}

function $reject(context, reason) {
	setState(context, REJECTED, reason);
}

function setState(context, state, value) {
	if (context._state != state) {
		context._value = value;
		context._state = state;
		context._flush();
	}
}

function unwrap(value, cb) {
	if (value instanceof WeePromise && value._state) {
		// non-pending WeePromise instances
		cb(value._state, value._value);
	} else if (isObject(value) || isFunction(value)) {
		// objects and functions
		var then;
		var one = getSingleCallable(function(fn, args) {
			fn.apply(UNDEFINED, args);
		});
		try {
			then = value.then;
			if (isFunction(then)) {
				then.call(value,
					function(_value) {
						one(unwrap, [_value, cb]);
					},
					function(_reason) {
						one(cb, [REJECTED, _reason]);
					}
				);
			} else {
				one(cb, [RESOLVED, value]);
			}
		}
		catch(err) {
			one(cb, [REJECTED, err]);
		}
	} else {
		// all other values
		cb(RESOLVED, value);
	}
}

function getSingleCallable(cb) {
	var called;
	return function() {
		if (!called) {
			cb.apply(UNDEFINED, arguments);
			called = true;
		}
	};
}

function isObject(subject) {
	return subject && typeof subject === 'object';
}

function isFunction(subject) {
	return typeof subject === 'function';
}

if (typeof exports == "object") {
module.exports = WeePromise;
} else {
global.WeePromise = WeePromise;
}
}(typeof window=="object"?window:global));