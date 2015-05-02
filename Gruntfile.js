/* eslint-env node */
module.exports = function(grunt) {
	'use strict';

	require('time-grunt')(grunt);
	require('jit-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		eslint: {
			src: {
				src: [
					'Gruntfile.js',
					'src/bigscreen.js'
				]
			}
		},

		uglify: {
			unminified: {
				options: {
					banner: '/*! <%= pkg.name %>\n * v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n * <%= pkg.homepage %>\n * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>; <%= pkg.license %> License\n */\n',
					mangle: false,
					compress: false,
					preserveComments: 'some',
					beautify: true
				},
				files: {
					'bigscreen.js': ['src/bigscreen.js']
				}
			},
			minified: {
				options: {
					banner: '// <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.license %> License',
					sourceMap: true
				},
				files: {
					'bigscreen.min.js': ['src/bigscreen.js']
				}
			}
		}

	});

	grunt.registerTask('remove_map_comment', function() {
		var fs = require('fs');
		var files = Object.keys(grunt.config('uglify.minified.files'));

		files.forEach(function(file) {
			var text = fs.readFileSync(file, 'utf8').replace(/\/\/# sourceMappingURL=\S+/, '');
			fs.writeFileSync(file, text);
		});
	});

	grunt.registerTask('default', ['eslint']);
	grunt.registerTask('build', ['eslint', 'uglify', 'remove_map_comment']);

};
