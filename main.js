// Generated by CoffeeScript 1.6.2
(function() {
  var coffee, compile_coffee, compile_stylus, error_page, file, fs, http, jade, path, read_utf8, static_files, stylus, url;

  coffee = require('coffee-script');

  fs = require('fs');

  jade = require('jade');

  http = require('http');

  path = require('path');

  static_files = require('node-static');

  stylus = require('stylus');

  url = require('url');

  exports.version = '0.2.0';

  file = new static_files.Server();

  read_utf8 = {
    encoding: 'utf8'
  };

  error_page = '<!doctype html><html><body><h1>{h1}</h1></body></html>';

  compile_coffee = function(raw_text, filename, callback) {
    var result;

    result = coffee.compile(raw_text);
    return callback(false, result);
  };

  compile_stylus = function(raw_text, filename, callback) {
    var options;

    options = {
      filename: filename
    };
    return stylus.render(raw_text, options, callback);
  };

  exports.handler = function(config) {
    return function(req, res, next) {
      var fn_base, full_fn, req_ext, req_path, respond_compiled_text, respond_error, respond_file, respond_jade, respond_text, url_q;

      console.log(req.method + ' ' + req.url);
      if (!next) {
        next = function() {
          return respond_error(404);
        };
      }
      respond_error = function(code) {
        var page;

        res.writeHead(code, {
          'Content-Type': 'text/html'
        });
        page = error_page.replace('{h1}', code);
        return res.end(page);
      };
      respond_text = function(text, mime_type) {
        res.writeHead(200, {
          'Content-Type': mime_type
        });
        return res.end(text);
      };
      respond_file = function(file_name, mime_type) {
        return fs.readFile(file_name, read_utf8, function(err, raw_text) {
          if (err) {
            console.error('Could not read ' + file_name);
            return respond_error(500);
          } else {
            return respond_text(raw_text, mime_type);
          }
        });
      };
      respond_compiled_text = function(fn_base, ext_from, ext_to, mime_type, compiler) {
        var files_exist, full_fn_from, full_fn_to;

        full_fn_from = path.join(config.path, fn_base + ext_from);
        full_fn_to = path.join(config.path, fn_base + ext_to);
        files_exist = function() {
          return fs.readFile(full_fn_from, read_utf8, function(err, raw_text) {
            if (err) {
              console.error('Could not read ' + full_fn_from);
              return respond_error(500);
            } else {
              return compiler(raw_text, full_fn_from, function(err, compiled_text) {
                if (err) {
                  console.error('Could not compile ' + full_fn_from);
                  return respond_error(500);
                } else {
                  return respond_text(compiled_text, mime_type);
                }
              });
            }
          });
        };
        return fs.exists(full_fn_to, function(exists) {
          if (exists) {
            return respond_file(full_fn_to, mime_type);
          } else {
            return fs.exists(full_fn_from, function(exists) {
              if (exists) {
                return files_exist();
              } else {
                return next();
              }
            });
          }
        });
      };
      respond_jade = function(fn_base) {
        var fn_jade, serve_jade;

        serve_jade = function(fn_jade) {
          return fs.readFile(fn_jade, read_utf8, function(err, jade_text) {
            if (err) {
              console.error('Could not read ' + fn_jade);
              return respond_error(500);
            } else {
              return fs.readFile(fn_base + '.json', read_utf8, function(err, json_text) {
                var fn, html, jade_cfg, json_obj;

                if (err) {
                  json_obj = {};
                } else {
                  json_obj = JSON.parse(json_text);
                }
                jade_cfg = {
                  filename: path.join(config.path, fn_jade)
                };
                fn = jade.compile(jade_text, jade_cfg);
                html = fn(json_obj);
                return respond_text(html, 'text/html');
              });
            }
          });
        };
        fn_jade = fn_base + '.jade';
        return fs.exists(fn_jade, function(exists) {
          if (exists) {
            return serve_jade(fn_jade);
          } else {
            fn_jade = fn_base + '/index.jade';
            return fs.exists(fn_jade, function(exists) {
              if (exists) {
                return serve_jade(fn_jade);
              } else {
                return next();
              }
            });
          }
        });
      };
      url_q = url.parse(req.url);
      req_path = url_q.pathname === '/' ? 'index' : url_q.pathname.slice(1);
      req_ext = path.extname(req_path);
      if (('.html' === req_ext) || ('' === req_ext)) {
        if ('.html' === req_ext) {
          fn_base = req_path.slice(0, -5);
        } else {
          fn_base = req_path;
        }
        return fs.exists(fn_base + '.html', function(exists) {
          if (exists) {
            return respond_file(fn_base + '.html', 'text/html');
          } else {
            return fs.exists(fn_base + 'index.html', function(exists) {
              if (exists) {
                return respond_file(fn_base + 'index.html', 'text/html');
              } else {
                return respond_jade(fn_base);
              }
            });
          }
        });
      } else if ('.css' === req_ext) {
        fn_base = req_path.slice(0, -4);
        return respond_compiled_text(fn_base, '.styl', '.css', 'text/css', compile_stylus);
      } else if ('.js' === req_ext) {
        fn_base = req_path.slice(0, -3);
        return respond_compiled_text(fn_base, '.coffee', '.js', 'text/javascript', compile_coffee);
      } else {
        full_fn = path.join(config.path, req_path);
        console.log(full_fn);
        return fs.exists(full_fn, function(exists) {
          if (exists) {
            return file.serve(req, res);
          } else {
            return next();
          }
        });
      }
    };
  };

  exports.startServer = function(config) {
    var app, listener;

    listener = exports.handler(config);
    app = http.createServer(listener);
    app.listen(config.port, config.hostname);
    return console.log('Jader running on ' + config.hostname + ':' + config.port);
  };

}).call(this);
