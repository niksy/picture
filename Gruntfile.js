module.exports = function (grunt) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		meta: {
			banner: '<%= pkg.name %> v<%= pkg.version %> - <%= pkg.description %>. Authors & copyright (c) <%= grunt.template.today("yyyy") %>: WebLinc, <%= pkg.author %>. Forked & modified by <%= pkg.contributors[0] %>',
			defaultBanner: '/* <%= meta.banner %> */\n',
			unstrippedBanner: '/*! <%= meta.banner %> */\n'
		},

		concat: {
			options: {
				stripBanners: true,
				banner: '<%= meta.defaultBanner %>'
			},
			dist: {
				src: ['picture.js'],
				dest: 'picture.js'
			}
		},

		uglify: {
			options: {
			banner: '<%= meta.unstrippedBanner %>'
			},
			dist: {
				files: {
					'picture.min.js': ['picture.js']
				}
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	grunt.registerTask( 'default', ['concat:dist', 'uglify:dist'] );

};

