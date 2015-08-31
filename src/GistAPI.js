var API = 'https://api.github.com/gists',
    d3 = require('d3');

function GistAPI(auth) {
  this._h = {Accept: 'application/vnd.github.v3+json'};
  if (auth) {
    this._h.Authorization = (auth.length === 1) ?
      ('token ' + auth[0]) :
      ('Basic ' + btoa(auth[0] + ':' + auth[1]));
  }
}

var proto = GistAPI.prototype;

proto.get = function(id, cb) {
  send('GET', API+'/'+id, this._h, null, cb);
};

proto.post = function(data, cb) {
  send('POST', API, this._h, data, cb);
};

proto.patch = function(id, data, cb) {
  send('PATCH', API+'/'+id, this._h, data, cb);
};

proto.delete = function(id, cb) {
  if (!this._h.Authorization) {
    cb(Error('Can not delete anonymous gists! ' +
      'Contact GitHub support to request deletion.'));
    return;
  }
  send('DELETE', API+'/'+id, this._h, null, cb);
};

function send(method, uri, headers, data, cb) {
  var xhr = d3.xhr(uri);
  for (var key in headers) xhr.header(key, headers[key]);
  xhr.send(method, data ? JSON.stringify(data) : null, function(err, r) {
    if (cb) cb(err, r.responseText ? JSON.parse(r.responseText) : null);
  });
}

module.exports = GistAPI;
