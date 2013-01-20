/*jshint node:true */
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: {
				src: ['Gruntfile.js', 'src/**/*.js']
			}
		},

		concat: {
			options: {
				stripBanners: true,
				banner: '/*! <%= pkg.name %>\n * v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n * <%= pkg.homepage %>\n * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>; <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n */\n'
			},
			all: {
				src: ['src/**/*.js'],
				dest: 'bigscreen.js'
			}
		},

		uglify: {
			options: {
				banner: '// <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> - <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n'
			},
			all: {
				src: ['bigscreen.js'],
				dest: 'bigscreen.min.js'
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('release', ['jshint', 'concat', 'uglify']);

};