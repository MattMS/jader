gulp = require 'gulp'
jade = require 'gulp-jade'


gulp.task 'default', ->
	gulp.src './index.jade'
	.pipe jade()
	.pipe gulp.dest '.'
