fs = require 'fs'
http = require 'http'
path = require 'path'
url = require 'url'

coffee = require 'coffee-script'
jade = require 'jade'
static_files = require 'node-static'
stylus = require 'stylus'


exports.version = '0.2.0'

file = new static_files.Server()

read_utf8 = encoding: 'utf8'

error_page = '<!doctype html><html><body><h1>{h1}</h1></body></html>'


compile_coffee = (raw_text, filename, callback)->
	result = coffee.compile raw_text

	callback false, result


compile_stylus = (raw_text, filename, callback)->
	options = filename: filename

	stylus.render raw_text, options, callback


exports.handler = (config)->
	(req, res, next)->
		console.log req.method + ' ' + req.url

		if not next
			next = ->
				respond_error 404


		respond_error = (code)->
			res.writeHead code, 'Content-Type': 'text/html'

			page = error_page.replace '{h1}', code

			res.end page


		respond_text = (text, mime_type)->
			res.writeHead 200, 'Content-Type': mime_type

			res.end text


		respond_file = (file_name, mime_type)->
			fs.readFile file_name, read_utf8, (err, raw_text)->
				if err
					console.error 'Could not read ' + file_name

					respond_error 500

				else
					respond_text raw_text, mime_type


		respond_compiled_text = (fn_base, ext_from, ext_to, mime_type, compiler)->
			full_fn_from = path.join config.path, fn_base + ext_from

			full_fn_to = path.join config.path, fn_base + ext_to

			files_exist = ->
				fs.readFile full_fn_from, read_utf8, (err, raw_text)->
					if err
						console.error 'Could not read ' + full_fn_from

						respond_error 500

					else
						compiler raw_text, full_fn_from, (err, compiled_text)->
							if err
								console.error 'Could not compile ' + full_fn_from

								respond_error 500

							else
								respond_text compiled_text, mime_type

			fs.exists full_fn_to, (exists)->
				if exists
					respond_file full_fn_to, mime_type
				else
					fs.exists full_fn_from, (exists)->
						if exists
							files_exist()
						else
							next()


		respond_jade = (fn_base)->
			serve_jade = (fn_jade)->
				fs.readFile fn_jade, read_utf8, (err, jade_text)->
					if err
						console.error 'Could not read ' + fn_jade
						respond_error 500
					else
						fs.readFile fn_base + '.json', read_utf8, (err, json_text)->
							if err
								json_obj = {}
							else
								json_obj = JSON.parse json_text

							jade_cfg =
								filename: path.join config.path, fn_jade
							fn = jade.compile jade_text, jade_cfg
							html = fn json_obj
							respond_text html, 'text/html'

			fn_jade = fn_base + '.jade'
			fs.exists fn_jade, (exists)->
				if exists
					serve_jade fn_jade
				else
					fn_jade = fn_base + '/index.jade'
					fs.exists fn_jade, (exists)->
						if exists
							serve_jade fn_jade
						else
							next()


		url_q = url.parse req.url

		req_path =
			if '/' == url_q.pathname
				'index'
			else
				url_q.pathname.slice 1

		req_ext = path.extname req_path

		if ('.html' == req_ext) or ('' == req_ext)
			fn_base =
				if '.html' == req_ext
					req_path.slice 0, -5
				else
					req_path

			fs.exists fn_base + '.html', (exists)->
				if exists
					respond_file fn_base + '.html', 'text/html'

				else
					fs.exists fn_base + 'index.html', (exists)->
						if exists
							respond_file fn_base + 'index.html', 'text/html'

						else
							respond_jade fn_base

		else if '.css' == req_ext
			fn_base = req_path.slice 0, -4

			respond_compiled_text fn_base, '.styl', '.css', 'text/css', compile_stylus

		else if '.js' == req_ext
			fn_base = req_path.slice 0, -3

			respond_compiled_text fn_base, '.coffee', '.js', 'text/javascript', compile_coffee

		else
			full_fn = path.join config.path, req_path

			console.log full_fn

			fs.exists full_fn, (exists)->
				if exists
					file.serve req, res

				else
					next()


exports.startServer = (config)->
	listener = exports.handler config

	app = http.createServer listener

	app.listen config.port, config.hostname

	console.log 'Jader running on ' + config.hostname + ':' + config.port
