/*jshint node:true */
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			options: grunt.file.readJSON('.jshintrc'),
			dev: {
				src: ['Gruntfile.js', 'src/**/*.js']
			},
			beforeconcat: {
				options: {
					devel: false
				},
				src: ['Gruntfile.js', 'src/**/*.js']
			},
			afterconcat: {
				options: {
					devel: false
				},
				src: ['bigscreen.js']
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
			unminified: {
				options: {
					banner: '',
					mangle: false,
					compress: false,
					preserveComments: 'some',
					beautify: true
				},
				src: ['bigscreen.js'],
				dest: 'bigscreen.js'
			},
			minified: {
				src: ['bigscreen.js'],
				dest: 'bigscreen.min.js'
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-clean');

	grunt.registerTask('default', ['jshint:dev']);
	grunt.registerTask('release', ['jshint:beforeconcat', 'concat', 'jshint:afterconcat', 'uglify:unminified', 'uglify:minified']);

};