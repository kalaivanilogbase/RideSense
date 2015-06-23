'use strict';
module.exports = function (grunt) {
    var appConfig = {
        app: require('./bower.json').appPath || 'app',
        dist: 'dist'
    };

    var config = {
        yeoman: appConfig,

        pkg: grunt.file.readJSON('package.json'),
        baseDir: '.',
        srcDir: 'app',
        destDir: 'dist',
        tempDir: 'tmp',
        docsDir: 'docs/',
        copy: {
            main: {
                files: [
                    { expand: true, src: ['app/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['assets/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['bower_components/**'], dest: '<%= tempDir %>' },
                    { expand: true, src: ['index.html'], dest: '<%= tempDir %>' },
                ]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= tempDir %>',
                    src: [
                        'index.html',
                        '**/*.html'],
                    dest: '<%= tempDir %>'
                },
                ]
            }
        },
        cssmin: {
            my_target: {
                files: [{
                    expand: true,
                    cwd: '<%= tempDir %>/assets/css/',
                    src: ['*.css', '!*.min.css'],
                    dest: '<%= tempDir %>/assets/css/',
                    ext: '.min.css'
                }]
            },
            combine: {
                files: {
                    '<%= tempDir %>/assets/css/style.build.min.css':
                        ['<%= tempDir %>/assets/css/main.css',
                        '<%= tempDir %>/bower_components/bootstrap/dist/css/bootstrap.css',
                        '<%= tempDir %>/bower_components/bootstrap/dist/css/bootstrap-theme.css']
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "app/main.js",
                    appDir: "<%= tempDir %>/",
                    baseUrl: "app",
                    removeCombined: true,
                    findNestedDependencies: true,
                    normalizeDirDefines: 'all',
                    inlineText: true,
                    skipPragmas: true,
                    dir: "<%= destDir %>",
                    optimize: "none",
                    optimizeCss: "none",
                    modules: [
                        {
                            name: "main"
                        },
                        {
                            name: "lib",
                            exclude: ["main"]
                        }
                    ],
                    generateSourceMaps: false,
                    optimizeAllPluginResources: true
                },
            },
                
        },
        //clean: {
          //  build: ['<%= tempDir %>', '<%= destDir %>/app/Scripts', '<%= destDir %>/bower_components', '<%= destDir %>/assets/less', '<%= destDir %>/assets/plugins'],
        //},
        uglify: {
            my_target: {
                files: [{
                    expand: true,
                    dest: '<%= destDir %>',
                    cwd: '<%= destDir %>',
                    src: ['app/*.js', 'app/**/*.js', '!app/**/*.min.js']
                }]
            },
            options: {
                mangle: false,
                //squeeze: true,
                //quite: true,
                compress: {
                    sequences: true,
                    dead_code: true,
                    conditionals: true,
                    booleans: true,
                    unused: true,
                    if_return: true,
                    join_vars: true,
                    drop_console: true
                },
                preserveComments: false
            }
        },

        watch: {
      bower: {
        files: ['bower.json']
      },
      js: {
        files: ['<%= yeoman.app %>/app/{,*/}*.*'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      styles: {
        files: ['<%= yeoman.app %>/assets/css/{,*/}*.css'],
        tasks: ['newer:copy:styles', 'autoprefixer']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= yeoman.app %>/assets/img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },
    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect.static('test'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/scripts/{,*/}*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },
    };

    // load plugins
    require('load-grunt-tasks')(grunt);

    // load task definitions
    grunt.loadTasks('tasks');

    grunt.initConfig(config);
};