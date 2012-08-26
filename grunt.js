module.exports = function(grunt) {
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*!\n' +
					'* <%= pkg.name %>\n' +
					'* v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
					'<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
					'* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
					' <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n' +
					'*/'
		},
		concat: {
			dist: {
				src: ['<banner:meta.banner>', 'bigscreen.js'],
				dest: 'dist/bigscreen.js'
			}
		},
		min: {
			dist: {
				src: ['<banner:meta.banner>', 'bigscreen.js'],
				dest: 'dist/bigscreen.min.js'
			}
		},
		lint: {
			all: ['bigscreen.js']
		},
		jshint: {
			options: {
				es5: true,
				esnext: true,
				bitwise: true,
				curly: true,
				eqeqeq: true,
				latedef: true,
				newcap: true,
				noarg: true,
				noempty: true,
				regexp: true,
				undef: true,
				strict: true,
				trailing: true,
				smarttabs: true,
				browser: true,
				nonstandard: true
			}
		}
	});

	grunt.registerTask('default', 'lint');
    grunt.registerTask('release', 'lint concat min');
};