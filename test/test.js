(function() {


  var util = require( 'util' );
  var WeePromise = require( '../index.js' );
  var ES6_Promise = require( 'es6-promise' ).Promise;
  var chai = require( 'chai' );
  var assert = chai.assert;
  var expect = chai.expect;


  [
    [ WeePromise , 'wee-promise' ],
    [ ES6_Promise , 'es6-promise' ]
  ]
  .forEach(function( args ) {


    var Promise = args[0];
    var name = args[1];
    

    describe( name , function() {

      describe( 'Constructor' , function() {
        it( 'should fail silently when an error is thrown' , function( done ) {
          new Promise(function( resolve , reject ) {
            async( done );
            throw new Error( 'error' );
          });
        });
      });

      describe( '#then()' , function() {
        it( 'should do nothing when resolve is called twice' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
            resolve();
          })
          .then(function() {
            done();
          });
        });
        it( 'should do nothing if the promise is rejected' , function( done ) {
          new Promise(function( resolve , reject ) {
            reject();
            resolve();
          })
          .then(function() {
            done();
          })
          .catch(function() {
            done();
          });
        });
        it( 'should fail silently when an error is thrown' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
          })
          .then(function() {
            async( done );
            throw new Error( 'error' );
          });
        });
        it( 'should pass returned args to the next then function' , function( done ) {
          new Promise(function( resolve ) {
            async(function() {
              resolve( 'a' );
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'a' );
            return val + 'b';
          })
          .then(function( val ) {
            expect( val ).to.equal( 'ab' );
            return val + 'c';
          })
          .then(function( val ) {
            expect( val ).to.equal( 'abc' );
            done();
          })
          .catch( done );
        });
        it( 'should allow for promise chaining (asynchronous)' , function( done ) {

          var start = Date.now();
          var delay = 100;
          var tolerance = 50;
          var i = 0;

          new Promise(function( resolve ) {
            async( resolve , delay );
          })
          .then(function() {
            i++;
            expect( Date.now() - start ).to.be.closeTo( i * delay , tolerance );
            return new Promise(function( resolve ) {
              async( resolve , delay );
            });
          })
          .then(function() {
            i++;
            expect( Date.now() - start ).to.be.closeTo( i * delay , tolerance );
            return new Promise(function( resolve ) {
              async( resolve , delay );
            });
          })
          .then(function() {
            i++;
            expect( Date.now() - start ).to.be.closeTo( i * delay , tolerance );
            return 5;
          })
          .then(function( val ) {
            expect( val ).to.equal( 5 );
            expect( Date.now() - start ).to.be.closeTo( i * delay , tolerance );
            done();
          })
          .catch( done );
        });
        it( 'should allow for promise chaining (synchronous)' , function( done ) {
          new Promise(function( resolve ) {
            resolve();
          })
          .then(function() {
            return new Promise(function( resolve ) {
              resolve();
            });
          })
          .then(function() {
            return new Promise(function( resolve ) {
              resolve();
            });
          })
          .then(function() {
            return 5;
          })
          .then(function( val ) {
            expect( val ).to.equal( 5 );
            done();
          })
          .catch( done );
        });
        it( 'should pass resolved args along promise chains (asynchronous)' , function( done ) {
          new Promise(function( resolve ) {
            async(function() {
              resolve( 'a' );
            }, 10);
          })
          .then(function( val ) {
            expect( val ).to.equal( 'a' );
            return new Promise(function( resolve ) {
              async(function() {
                resolve( val + 'b' );
              }, 10);
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'ab' );
            return new Promise(function( resolve ) {
              async(function() {
                resolve( val + 'c' );
              }, 10);
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'abc' );
            return new Promise(function( resolve ) {
              async(function() {
                resolve( val + 'd' );
              }, 10);
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'abcd' );
            done();
          })
          .catch( done );
        });
        it( 'should pass resolved args along promise chains (synchronous)' , function( done ) {
          new Promise(function( resolve ) {
            resolve( 'a' );
          })
          .then(function( val ) {
            expect( val ).to.equal( 'a' );
            return new Promise(function( resolve ) {
              resolve( val + 'b' );
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'ab' );
            return new Promise(function( resolve ) {
              resolve( val + 'c' );
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'abc' );
            return new Promise(function( resolve ) {
              resolve( val + 'd' );
            });
          })
          .then(function( val ) {
            expect( val ).to.equal( 'abcd' );
            done();
          })
          .catch( done );
        });
      });

      describe( '#catch()' , function() {
        it( 'should do nothing when reject is called twice' , function( done ) {
          new Promise(function( resolve , reject ) {
            reject();
            reject();
          })
          .catch(function() {
            done();
          });
        });
        it( 'should do nothing if the promise is resolved' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
            reject();
          })
          .then(function() {
            done();
          })
          .catch(function() {
            done();
          });
        });
        it( 'should catch errors thrown in the resolver function' , function( done ) {
          new Promise(function( resolve , reject ) {
            throw new Error( 'error' );
          })
          .catch(function( err ) {
            assert.instanceOf( err , Error );
            done();
          });
        });
        it( 'should catch errors thrown in then' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
          })
          .then(function() {
            throw new Error( 'error' );
          })
          .catch(function( err ) {
            assert.instanceOf( err , Error );
            done();
          });
        });
        it( 'should catch errors thrown in catch' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
          })
          .then(function() {
            throw new Error( 'error' );
          })
          .catch(function( err ) {
            async( done );
            throw new Error( 'error' );
          });
        });
        it( 'should receive the error thrown in the resolver function' , function( done ) {
          new Promise(function( resolve , reject ) {
            throw new Error( 'error' );
          })
          .catch(function( err ) {
            assert.instanceOf( err , Error );
            done();
          });
        });
        it( 'should receive the error thrown in then' , function( done ) {
          new Promise(function( resolve , reject ) {
            resolve();
          })
          .then(function() {
            throw new Error( 'error' );
          })
          .catch(function( err ) {
            assert.instanceOf( err , Error );
            done();
          });
        });
      });

      describe( '#all()' , function() {

        describe( '#then()' , function() {
          it( 'should be executed once all promises are resolved (asynchronous)' , function( done ) {
            all_then( Promise , false , function( result ) {
              done();
            });
          });
          it( 'should be executed once all promises are resolved (synchronous)' , function( done ) {
            all_then( Promise , true , function( result ) {
              done();
            });
          });
          it( 'should receive a result array equal to the length of the promises array (asynchronous)' , function( done ) {
            all_then( Promise , false , function( result , test ) {
              try {
                expect( result.length ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
          it( 'should receive a result array equal to the length of the promises array (synchronous)' , function( done ) {
            all_then( Promise , true , function( result , test ) {
              try {
                expect( result.length ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
        });

        describe( '#catch()' , function() {
          it( 'should be executed if a promise is rejected (asynchronous)' , function( done ) {
            all_catch( Promise , false , function( result ) {
              done();
            });
          });
          it( 'should be executed if a promise is rejected (synchronous)' , function( done ) {
            all_catch( Promise , true , function( result ) {
              done();
            });
          });
          it( 'should receive arguments from the first promise that was rejected (asynchronous)' , function( done ) {
            all_catch( Promise , false , function( result , test ) {
              try {
                expect( result ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
          it( 'should receive arguments from the first promise that was rejected (synchronous)' , function( done ) {
            all_catch( Promise , true , function( result , test ) {
              try {
                expect( result ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
        });
      });

      describe( '#race()' , function() {

        describe( '#then()' , function() {
          it( 'should be executed once the first promise is resolved (asynchronous)' , function( done ) {
            race_then( Promise , false , function( result ) {
              done();
            });
          });
          it( 'should be executed once the first promise is resolved (synchronous)' , function( done ) {
            race_then( Promise , true , function( result ) {
              done();
            });
          });
          it( 'should receive arguments from the first promise that was resolved (asynchronous)' , function( done ) {
            race_then( Promise , false , function( result , test ) {
              try {
                expect( result ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
          it( 'should receive arguments from the first promise that was resolved (synchronous)' , function( done ) {
            race_then( Promise , true , function( result , test ) {
              try {
                expect( result ).to.equal( test );
                done();
              }
              catch ( err ) {
                done( err );
              }
            });
          });
        });
      });
    });
  });


  function log() {
    var args = Array.prototype.slice.call( arguments , 0 );
    args = args.map(function( arg ) {
      return util.inspect.apply( util , [ arg , { colors: true, depth: 3 }]);
    });
    console.log.apply( console , args );
  }

  
  function all_then( Promise , sync , callback ) {

    var count = 5;
    var promises = [];

    for (var i = 0; i < count; i++) {
      promises.push(
        (function( i ) {
          return new Promise(function( resolve , reject ) {
            if (sync) {
              resolve( i );
            }
            else {
              async(function() {
                resolve( i );
              });
            }
          });
        }( i ))
      );
    }

    Promise.all( promises ).then(function( result ) {
      callback( result , count );
    });
  }


  function all_catch( Promise , sync , callback ) {

    var count = 5;
    var target = [ 2 , 3 ];
    var promises = [];
    var arr = [];

    function determine( i , resolve , reject ) {
      if (target.indexOf( i ) >= 0) {
        reject( i );
      }
      else {
        resolve( i );
      }
    }

    for (var i = 0; i < count; i++) {
      promises.push(
        (function( i ) {
          return new Promise(function( resolve , reject ) {
            if (sync) {
              determine( i , resolve , reject );
            }
            else {
              async(function() {
                determine( i , resolve , reject );
              });
            }
          });
        }( i ))
      );
    }

    Promise.all( promises ).catch(function( result ) {
      callback( result , target[0] );
    });
  }


  function race_then( Promise , sync , callback ) {

    var count = 5;
    var target = [ 2 , 3 ];
    var test = sync ? 0 : target[0];
    var promises = [];

    for (var i = 0; i < count; i++) {
      promises.push(
        (function( i ) {
          return new Promise(function( resolve , reject ) {
            if (sync) {
              resolve( i );
            }
            else {
              var t = (target.indexOf( i ) >= 0 ? 1 : count);
              async(function() {
                resolve( i );
              }, t );
            }
          });
        }( i ))
      );
    }

    Promise.race( promises ).then(function( result ) {
      callback( result , test );
    });
  }


  function async( callback , delay ) {
    setTimeout( callback , ( delay || 1 ));
  }


}());




























