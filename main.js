// Generated by CoffeeScript 1.9.2
(function() {
  var coffee, compile, compile_coffee, compile_jade, compile_stylus, error_page, find_compiler, fs, http, jade, package_json, path, read_json_file, read_text_file, read_text_file_or_500, respond_error, respond_file, static_files, stylus, url;

  fs = require('fs');

  http = require('http');

  path = require('path');

  url = require('url');

  coffee = require('coffee-script');

  jade = require('jade');

  static_files = require('node-static');

  stylus = require('stylus');

  package_json = require('./package.json');

  exports.version = package_json.version;

  read_json_file = function(json_file_path, callback) {
    return read_text_file(json_file_path, function(err, json_file_content) {
      if (err) {
        return callback({});
      } else {
        return callback(json.parse(json_file_content));
      }
    });
  };

  read_text_file = function(file_path, callback) {
    return fs.readFile(file_path, {
      encoding: 'utf8'
    }, callback);
  };

  read_text_file_or_500 = function(req, res, file_path, callback) {
    return read_text_file(file_path, function(err, file_content) {
      if (err) {
        console.error('Could not read %s', file_path);
        res.statusCode = 500;
        return respond_error(req, res);
      } else {
        return callback(file_content);
      }
    });
  };

  compile = function(req, res, file_path, compiler) {
    return read_text_file_or_500(req, res, file_path, function(file_content) {
      return compiler(req, res, file_content, file_path, function(err, compiled_content) {
        if (err) {
          console.error('Could not compile %s', file_path);
          res.statusCode = 500;
          return respond_error(req, res);
        } else {
          res.statusCode = 200;
          return res.end(compiled_content);
        }
      });
    });
  };

  compile_coffee = function(req, res, file_content, file_path, callback) {
    res.setHeader('Content-Type', 'text/javascript');
    return callback(false, coffee.compile(file_content));
  };

  compile_jade = function(req, res, file_content, file_path, callback) {
    var base_path;
    res.setHeader('Content-Type', 'text/html');
    base_path = file_path.slice(0, -5);
    return read_json_file(base_path + ".json", function(json_obj) {
      var jade_compiler;
      jade_compiler = jade.compile(file_content, {
        filename: file_path
      });
      return callback(false, jade_compiler(json_obj));
    });
  };

  compile_stylus = function(req, res, file_content, file_path, callback) {
    return stylus.render(file_content, {
      filename: file_path
    }, function(err, text) {
      if (!err) {
        res.setHeader('Content-Type', 'text/css');
      }
      return callback(err, text);
    });
  };

  find_compiler = function(file_path, callback) {
    var check_compiler, file_path_ext;
    file_path_ext = path.extname(file_path);
    check_compiler = function(check_index) {
      var base_path, compiler, path_ext, ref, source_path, url_ext;
      if (check_index >= exports.compile_types.length) {
        return callback(false, false);
      }
      ref = exports.compile_types[check_index], url_ext = ref[0], path_ext = ref[1], compiler = ref[2];
      if (file_path_ext !== url_ext) {
        return check_compiler(check_index + 1);
      } else {
        base_path = file_path.slice(0, -url_ext.length);
        source_path = base_path + path_ext;
        return fs.exists(source_path, function(exists) {
          if (exists) {
            return callback(source_path, compiler);
          } else {
            return check_compiler(check_index + 1);
          }
        });
      }
    };
    return check_compiler(0);
  };

  exports.compile_types = [['.css', '.styl', compile_stylus], ['.js', '.coffee', compile_coffee], ['.js', '.coffee.md', compile_coffee], ['.js', '.litcoffee', compile_coffee], ['.html', '.jade', compile_jade]];

  error_page = '<!doctype html><html><body><h1>{h1}</h1></body></html>';

  respond_error = function(req, res) {
    var page;
    res.setHeader('Content-Type', 'text/html');
    page = error_page.replace('{h1}', res.statusCode);
    return res.end(page);
  };

  respond_file = function(req, res, file_path) {
    return read_text_file_or_500(req, res, file_path, function(err, file_content) {
      res.statusCode = 200;
      return res.end(file_content);
    });
  };

  exports.handler = function(config) {
    var static_server;
    static_server = new static_files.Server();
    return function(req, res, next) {
      var file_path, url_ext, url_parts, url_path;
      console.info('%s %s', req.method, req.url);
      url_parts = url.parse(req.url);
      url_path = url_parts.pathname;
      if (url_path.endsWith('/')) {
        url_path += 'index.html';
      }
      url_path = url_path.slice(1);
      url_ext = path.extname(url_path);
      if ('' === url_ext) {
        url_path += '.html';
      }
      file_path = path.join(config.path, url_path);
      console.log('File path: %s', file_path);
      return fs.exists(file_path, function(exists) {
        if (exists) {
          console.log('Send static file: %s', file_path);
          return static_server.serve(req, res);
        } else {
          return find_compiler(file_path, function(source_path, compiler) {
            if (source_path && compiler) {
              return compile(req, res, source_path, compiler);
            } else if (next) {
              return next();
            } else {
              console.warn('Missing %s', req.url);
              res.statusCode = 404;
              return respond_error(req, res);
            }
          });
        }
      });
    };
  };

  exports.startServer = function(config) {
    var app, listener;
    listener = exports.handler(config);
    app = http.createServer(listener);
    app.listen(config.port, config.hostname);
    return console.info('Jader running on %s:%s', config.hostname, config.port);
  };

}).call(this);
