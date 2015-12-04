var RESOLVED = 1;
var REJECTED = 2;
var THEN = 'then';
var FAIL = 'fail';

function WeePromise( resolver ){
  var that = this;
  that._queue = Queue();
  that._inprog = false;
  that.resolve = getResolverArg( that , THEN );
  that.reject = getResolverArg( that , FAIL );
  if (resolver) {
    try {
      resolver( that.resolve , that.reject );
    }
    catch( err ){
      that.reject( err );
    }
  }
}

WeePromise.prototype._add = function( type , func ){
  var that = this;
  if (isFunction( func )) {
    that._queue.push( type , func );
  }
  return that;
};

WeePromise.prototype._exec = function( type , result ){
  var that = this,
    queue = that._queue,
    func;
  that._inprog = true;
  try {
    switch (type) {
      case THEN:
        while (func = queue.next( type )) {
          result = func.call( UNDEFINED , result );
          if (result == that){
            throw new TypeError( 'A promise cannot be resolved with itself.' );
          }
          if (isThenable( result )) {
            return handleThenable( that , result );
          }
        }
        that._state = RESOLVED;
      break;
      case FAIL:
        func = queue.next( type );
        if (func) {
          result = func.call( UNDEFINED , result );
          if (isThenable( result )) {
            return handleThenable( that , result );
          }
          return that._exec( THEN , result );
        }
        that._state = REJECTED;
      break;
    }
  }
  catch( err ) {
    return that._exec( FAIL , err );
  }
  that.result = result;
  that._inprog = false;
  return that;
};

WeePromise.prototype.then = function( onresolve , onreject ){
  return this
    ._add( THEN , onresolve )
    .fail( onreject );
};

WeePromise.prototype.fail = function( func ){
  return this._add( FAIL , func );
};

WeePromise.prototype.catch = WeePromise.prototype.fail;

WeePromise.resolve = function( result ){
  return new WeePromise().resolve( result );
};

WeePromise.reject = function( reason ){
  return new WeePromise().reject( reason );
};

WeePromise.all = function( collection ){
  return new WeePromise(function( resolve , reject ){
    var allResult = [],
      got = 0,
      need = collection.length;
    function handleResult( result , i ){
      allResult[i] = result;
      got++;
      if (got == need) {
        resolve( allResult );
      }
    }
    collection.forEach(function( child , i ){
      if (isThenable( child )) {
        child.then(function( result ){
          handleResult( result , i );
        })
        .fail(function( reason ){
          reject( reason );
        });
      }
      else {
        handleResult( child , i );
      }
    });
  });
};

WeePromise.race = function( collection ){
  return new WeePromise(function( resolve , reject ){
    collection.forEach(function( child ){
      if (isThenable( child )) {
        child.then( resolve ).fail( reject );
      }
      else {
        resolve( child );
      }
    });
  });
};

function getResolverArg( context , type ){
  return function( result ){
    asap(function(){
      if (!context._state) {
        context._exec( type , result );
      }
    });
    return context;
  };
}

function isFunction( subject ){
  return typeof subject == 'function';
}

function isThenable( subject ){
  return !!(subject && subject.then);
}

function handleThenable( context , thenable ){
  thenable.then(function( result ){
    context._exec( THEN , result );
  })
  .fail(function( result ){
    context._exec( FAIL , result );
  });
  return context;
}
