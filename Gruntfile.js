module.exports = function( grunt ) {


  var exec = require( 'child_process' ).exec;


  var Build = [
    'index.js'
  ];


  grunt.initConfig({

    pkg: grunt.file.readJSON( 'package.json' ),

    'git-describe': {
      'options': {
        prop: 'git-version'
      },
      dist: {}
    },

    jshint: {
      all: [ 'index.js' ]
    },

    clean: {
      all: [ '<%= pkg.name %>-*.js' ]
    },

    replace: [{
      options: {
        patterns: [
          {
            match: /\"version\".*?\".*\"/i,
            replacement: '\"version\": \"<%= pkg.version %>\"'
          },
          {
            match: /\"main\".*?\".*\"/i,
            replacement: '\"main\": \"<%= pkg.name %>-<%= pkg.version %>.min.js\"'
          }
        ]
      },
      files: [
        {
          src: 'package.json',
          dest: 'package.json'
        },
        {
          src: 'bower.json',
          dest: 'bower.json'
        }
      ]
    }],

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - <%= pkg.version %> - <%= pkg.author.name %> - <%= grunt.config.get( \'git-branch\' ) %> - <%= grunt.config.get( \'git-hash\' ) %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      release: {
        files: {
          '<%= pkg.name %>-<%= pkg.version %>.min.js': Build
        }
      }
    }
  });


  [
    'grunt-contrib-jshint',
    'grunt-contrib-clean',
    'grunt-git-describe',
    'grunt-replace',
    'grunt-contrib-uglify'
  ]
  .forEach( grunt.loadNpmTasks );


  grunt.registerTask( 'getHash' , function() {

    grunt.task.requires( 'git-describe' );

    var rev = grunt.config.get( 'git-version' );
    var matches = rev.match( /(\-{0,1})+([A-Za-z0-9]{7})+(\-{0,1})/ );

    var hash = matches
      .filter(function( match ) {
        return match.length === 7;
      })
      .pop();

    if (matches && matches.length > 1) {
      grunt.config.set( 'git-hash' , hash );
    }
    else{
      grunt.config.set( 'git-hash' , rev );
    }
  });


  grunt.registerTask( 'getBranch' , function() {
    var done = this.async();
    exec( 'git status' , function( err , stdout , stderr ) {
      if (!err) {
        var branch = stdout
          .split( '\n' )
          .shift()
          .replace( /on\sbranch\s/i , '' );
        grunt.config.set( 'git-branch' , branch );
      }
      done();
    });
  });


  grunt.registerTask( 'always' , [
    'jshint',
    'clean',
    'git-describe',
    'getHash',
    'getBranch',
    'replace'
  ]);


  grunt.registerTask( 'default' , [
    'always',
    'uglify'
  ]);
};



















