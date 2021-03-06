# Main script

## Imports

	fs = require 'fs'
	http = require 'http'
	path = require 'path'
	url = require 'url'

	coffee = require 'coffee-script'
	jade = require 'jade'
	static_files = require 'node-static'
	stylus = require 'stylus'

	package_json = require './package.json'

	exports.version = package_json.version


## Reading files

	read_json_file = (json_file_path, callback)->
		read_text_file json_file_path, (err, json_file_content)->
			if err
				callback {}

			else
				callback json.parse json_file_content


	read_text_file = (file_path, callback)->
		fs.readFile file_path, encoding: 'utf8', callback


	read_text_file_or_500 = (req, res, file_path, callback)->
		read_text_file file_path, (err, file_content)->
			if err
				console.error 'Could not read %s', file_path

				res.statusCode = 500

				respond_error req, res

			else
				callback file_content


## Compilers

	compile = (req, res, file_path, compiler)->
		read_text_file_or_500 req, res, file_path, (file_content)->
			compiler req, res, file_content, file_path, (err, compiled_content)->
				if err
					console.error 'Could not compile %s', file_path

					res.statusCode = 500

					respond_error req, res

				else
					res.statusCode = 200

					res.end compiled_content


	compile_coffee = (req, res, file_content, file_path, callback)->
		res.setHeader 'Content-Type', 'text/javascript'

		callback false, coffee.compile file_content


	compile_jade = (req, res, file_content, file_path, callback)->
		res.setHeader 'Content-Type', 'text/html'

		base_path = file_path.slice 0, -5

		read_json_file "#{base_path}.json", (json_obj)->
			jade_compiler = jade.compile file_content,
				filename: file_path

			callback false, jade_compiler json_obj


	compile_stylus = (req, res, file_content, file_path, callback)->
		stylus.render file_content,
			filename: file_path
		, (err, text)->
			if not err
				res.setHeader 'Content-Type', 'text/css'

			callback err, text


	find_compiler = (file_path, callback)->
		file_path_ext = path.extname file_path

		check_compiler = (check_index)->
			if check_index >= exports.compile_types.length
				return callback false, false

			[url_ext, path_ext, compiler] = exports.compile_types[check_index]

			if file_path_ext != url_ext
				check_compiler check_index + 1

			else
				base_path = file_path.slice 0, -url_ext.length

				source_path = base_path + path_ext

				fs.exists source_path, (exists)->
					if exists
						callback source_path, compiler

					else
						check_compiler check_index + 1

		check_compiler 0


	exports.compile_types = [
		['.css', '.styl', compile_stylus]
		['.js', '.coffee', compile_coffee]
		['.js', '.coffee.md', compile_coffee]
		['.js', '.litcoffee', compile_coffee]
		['.html', '.jade', compile_jade]
	]


## Responders

	error_page = '<!doctype html><html><body><h1>{h1}</h1></body></html>'


	respond_error = (req, res)->
		res.setHeader 'Content-Type', 'text/html'

		page = error_page.replace '{h1}', res.statusCode

		res.end page


	respond_file = (req, res, file_path)->
		read_text_file_or_500 req, res, file_path, (err, file_content)->
			res.statusCode = 200

			res.end file_content


## Request handler

	exports.handler = (config)->
		static_server = new static_files.Server()

		(req, res, next)->
			console.info '%s %s', req.method, req.url


### Standardise requested URL

			url_parts = url.parse req.url

			url_path = url_parts.pathname

			if url_path.endsWith '/'
				url_path += 'index.html'

			url_path = url_path.slice 1

Get the extension from the URL path.

			url_ext = path.extname url_path

Default to `.html` if no extension is given.

			if '' == url_ext
				url_path += '.html'


Translate the URL path to a file on the server file system.

			file_path = path.join config.path, url_path

			console.log 'File path: %s', file_path


### Static file

Check if the file exists and use static server if it does.

			fs.exists file_path, (exists)->
				if exists
					console.log 'Send static file: %s', file_path

					static_server.serve req, res


### Find and use compiler

If the file does not exist, find a compiler for it.

				else
					find_compiler file_path, (source_path, compiler)->
						if source_path and compiler
							compile req, res, source_path, compiler


### Next handler

If no file exists, then continue with the next handler.

						else if next
							next()


### 404

If no next handler was given, then send a 404 error.

						else
							console.warn 'Missing %s', req.url

							res.statusCode = 404

							respond_error req, res


## Start server

	exports.startServer = (config)->
		listener = exports.handler config

		app = http.createServer listener

		app.listen config.port, config.hostname

		console.info 'Jader running on %s:%s', config.hostname, config.port
