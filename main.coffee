express = require 'express'
fs = require 'fs'
path = require 'path'
url = require 'url'

exports.version = '0.1.0'

exports.handler = () ->
	(req, res, next) ->
		url_q = url.parse req.url
		fn_base = if url_q.pathname == '/' then 'index' else url_q.pathname.slice 1
		if path.extname(fn_base) == '.html'
			fn_base = path.basename fn_base, '.html'
		
		path.exists fn_base + '.jade', (exists) ->
			if exists
				render_jade = (fn_base, page_data={}) ->
					res.render fn_base + '.jade', page_data
				
				fs.readFile fn_base + '.json', (err, data) ->
					if err
						render_jade fn_base
					else
						json_data = JSON.parse data
						render_jade fn_base, json_data
			else
				next()

exports.startServer = (port) ->
	app = express.createServer()
	app.set 'views', process.cwd()
	app.set 'view engine', 'jade'
	app.set 'view options', {layout: false}
	app.use express.static process.cwd()
	app.use exports.handler()
	app.listen port
	console.log 'Jade server running on port ' + port
