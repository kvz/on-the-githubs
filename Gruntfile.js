module.exports = function(grunt) {
  // this is where all the grunt configs will go
  grunt.initConfig({
    // read the package.json
    // pkg will contain a reference to out pakage.json file use of which we will see later
    pkg: grunt.file.readJSON('package.json'),

    // configuration for the cssmin task
    // note that this syntax and options can found on npm page of any grunt plugin/task
    cssmin: {
      // options for css min task
      options:{
        // banner to be put on the top of the minified file using package name and todays date
        // note that we are reading our project name using pkg.name i.e name of our project
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      combine: {
        // options for combining files
        // we have defined cssFiles variable to hold our file names at the top
        files: {
          // here key part is output file which will our <package name>.min.css
          // value part is set of input files which will be combined/minified
          'build/css/<%= pkg.name %>.min.css': [
            'css/<%= pkg.name %>.css'
          ]
        }
      }
    },
    uglify: {
      options:{
        // banner to be put on the top of the minified file using package name and todays date
        // note that we are reading our project name using pkg.name i.e name of our project
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      onthegithubs: {
        files: {
          'build/js/jquery.on-the-githubs.min.js': [
            'js/jquery.timeago.js', 
            'js/jquery.on-the-githubs.js'
          ]
        }
      },
      jquery: {
        files: {
          'build/js/jquery.min.js': [
            'js/jquery.js'
          ]
        }
      }
    },
    clean: [
      'build/js', 
      'build/css', 
    ]
  }); // end of configuring the grunt task

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-release');

  // Default task(s).
  grunt.registerTask('default', ['clean', 'cssmin', 'uglify']);
  // clean task
  // grunt.registerTask('clean', ['clean']);
  // cssmin task
  // grunt.registerTask('buildcss', ['cssmin']);

};
