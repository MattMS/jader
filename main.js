(function() {
  var express, fs, path, url;

  express = require('express');

  fs = require('fs');

  path = require('path');

  url = require('url');

  exports.version = '0.1.0';

  exports.handler = function() {
    return function(req, res, next) {
      var fn_base, url_q;
      url_q = url.parse(req.url);
      fn_base = url_q.pathname === '/' ? 'index' : url_q.pathname.slice(1);
      if (path.extname(fn_base) === '.html') {
        fn_base = path.basename(fn_base, '.html');
      }
      return path.exists(fn_base + '.jade', function(exists) {
        var render_jade;
        if (exists) {
          render_jade = function(fn_base, page_data) {
            if (page_data == null) page_data = {};
            return res.render(fn_base + '.jade', page_data);
          };
          return fs.readFile(fn_base + '.json', function(err, data) {
            var json_data;
            if (err) {
              return render_jade(fn_base);
            } else {
              json_data = JSON.parse(data);
              return render_jade(fn_base, json_data);
            }
          });
        } else {
          return next();
        }
      });
    };
  };

  exports.startServer = function(port) {
    var app;
    app = express.createServer();
    app.set('views', process.cwd());
    app.set('view engine', 'jade');
    app.set('view options', {
      layout: false
    });
    app.use(express.static(process.cwd()));
    app.use(exports.handler());
    app.listen(port);
    return console.log('Jade server running on port ' + port);
  };

}).call(this);
