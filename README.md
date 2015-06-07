# Jade server

Jader lets you start a basic server in any folder.

It compiles
[Jade](http://jade-lang.com/)
templates, with embedded or linked
[CoffeeScript](http://coffeescript.org/),
[Markdown](https://daringfireball.net/projects/markdown/)
and
[Stylus](https://learnboost.github.io/stylus/)
files.

Please note: This is only intended for aiding development.

If you want to use Jade templates in production, consider using
[Express](http://expressjs.com/).

Alternatively, you can compile Jade files with `jade index.jade` or
[Gulp](http://gulpjs.com/),
but you may not have access to
[filters](http://jade-lang.com/reference/filters/)
this way.
Static files can then be served with [Nginx](http://nginx.org/).


## Usage

You should install Jader globally so that it creates the executable
script for you.

	npm install -g jader

You can then start the server on [localhost](http://localhost/)
in any directory:

	jader

If you need to use a different port to 80, use:

	jader -p 1337

Jader will also serve any other static files in the directory.


## Local variables

You can test the variables in templates by including a ".json" file
along with each ".jade" file.

Any JSON file with the same base-name as the Jade template will be read
and passed into the template as local variables.


### Example

index.jade

	doctype html
	html
		head
			title #{title}
		body
			p #{message}

index.json

	{
		"title": "My Page",
		"message": "It works!"
	}
