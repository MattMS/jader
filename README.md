
# Jader - Jade server

Jader allows you to start a simple server in any directory with Jade templates.

Please note: This is only intended for quickly prototyping Jade templates.
If you want to use Jade templates in a production server, consider using [Express](http://expressjs.com/).

## Usage

You should install Jader globally so that it creates the executable script for you.

	sudo npm install jader -g

You can then start the server on localhost:80 in any directory.

	jader

If you need to use a different port, use:

	jader 1337

Jader will serve any other static files in the directory.

## Local Variables

You can test the variables in templates by including a ".json" file along with each ".jade" file.

Any JSON file with the same basename as the Jade template will be read and passed into the template as local variables.

For example:

index.jade

	!!! 5
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
