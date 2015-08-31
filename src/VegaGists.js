var HOST = 'http://vega.github.io/vega-editor/',
    SPEC_FILE = 'spec.json',
    DEPS = [
      'topojson', 'd3.min', 'd3.geo.projection.min', 'd3.layout.cloud',
      'vega', 'vega-embed'
    ],
    GistAPI = require('./GistAPI');

function VegaGists(auth) {
  this._api = new GistAPI(auth);
  this._id = null;
}

var proto = VegaGists.prototype;

function onSave(error, resp) {
  if (error || !resp) {
    console.error(error);
    alert('Failed to save gist.');
  } else if (this._id && resp.id !== this._id) {
    alert('Inconsistent ids. Expected ' + this._id + ', received ' + resp.id + '.');
  } else {
    this._id = resp.id;
    alert('Successfuly saved gist: ' + resp.id + '.');
    console.log('SAVED GIST', resp.url, 'http://bl.ocks.org/' + resp.id);
  }
}

function onDelete(error, id) {
  if (error || !id) {
    console.error(error);
    alert('Failed to delete gist: ' + id + '.');
  } else {
    this._id = null;
    alert('Successfully deleted gist: ' + id + '.');
  }
}

// Open an existing GitHub Gist Vega example.
proto.open = function(ved, id) {
  var self = this;
  self._api.get(id, function(error, gist) {
    if (error) throw Error(error);
    var spec_file = gist.files[SPEC_FILE];
    if (!spec_file) throw Error('No specification file found.');

    if (spec_file.truncated) {
      // request file directly
      d3.text(spec_file.raw_url, function(error, data) {
        if (error) throw Error(error);
        ved.open(data);
        self._id = id;
      });
    } else {
      // use file contents
      ved.open(spec_file.content);
      self._id = id;
    }
  });
};

// Create a new GitHub Gist Vega example.
proto.create = function(ved, name) {
  var self = this,
      done = onSave.bind(self);

  self._id = null; // creating new gist, clear any prior id
  marshal(ved, name, function(error, data) {
    self._api.post(data, done);
  });
};

// Update the current GitHub Gist Vega example.
proto.save = function(ved, name) {
  var self = this,
      done = onSave.bind(self),
      id = this._id;

  if (!id) throw Error('No current gist exists.');
  marshal(ved, name, function(error, data) {
    self._api.patch(id, data, done);
  });
};

// Delete the current GitHub Gist Vega example.
proto.delete = function() {
  var self = this, id = this._id;
  if (!id) throw Error('No current gist exists.');
  return this._api.delete(id, function(err, resp) {
    onDelete.call(self, err, id);
  });
};

function marshal(ved, name, callback) {
  // TODO update baseURL as needed...
  var baseURL = HOST + 'app/'; // point to version 1.x for now

  var data = {
    'public': false, // TODO enable user setting
    'files': {
      'README.md': {'content': name},
      'index.html': {'content': index_html(baseURL)}
    }
  };
  if (name) data.description = name;
  data.files[SPEC_FILE] = {'content': ved.editor.getValue()};

  callback(null, data);
}

function index_html(baseURL) {
  return '<!DOCTYPE HTML>\n<meta charset="utf-8">\n' +
  '<link type="text/css" href="' + HOST + 'editor.css">\n' +
  DEPS.map(function(file) {
    return '<script src="' + HOST + 'vendor/' + file + '.js"></script>';
  }).join('\n') + '\n' +
  '<div id="view"></div>\n' +
  '<script>\n' +
  (baseURL ? '  vg.config.load.baseURL = "' + baseURL + '";\n' : '') +
  '  vg.embed("#view", "spec.json", function(view, spec) {\n' +
  '    window.vega = {view: view, spec: spec};\n' +
  '  });\n' +
  '</script>';
}

module.exports = VegaGists;
