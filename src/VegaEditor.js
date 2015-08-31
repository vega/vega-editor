var d3 = require('d3'),
    vg = require('vega');

function VegaEditor() {
  this.version = VegaEditor.version;
  this.data = undefined;
  this.renderType = 'canvas';
  this.editor = null;
  this.examples = [];
}

VegaEditor.version = '__VERSION__';
VegaEditor.VegaGists = require('./VegaGists');

var proto = VegaEditor.prototype;

proto.init = function(elt, dir) {
  var ved = this,
      PATH = dir || ''; // Set base directory

  ved.path = (vg.config.load.baseURL = PATH);
  ved.$d3 = d3.select(elt);

  // Load template and examples, then render view
  d3.json(PATH + 'examples.json', function(err, examples) {
    ved.examples = Object.keys(examples).reduce(function(a, k) {
      return a.concat(examples[k].map(function(d) { return d.name; }));
    }, []);
    d3.text(PATH + 'template.html', function(err, template) {
      ved.render(template, examples);
      ved.params();
    });
  });

  // Handle HTML5 post messages
  window.addEventListener('message', function(evt) {
    var data = evt.data;
    console.log('[Vega-Editor] Received Message', evt.origin, data);

    // send acknowledgement
    if (data.spec || data.file) {
      evt.source.postMessage(true, '*');
    }

    // load spec
    if (data.spec) {
      ved.open(data.spec);
    } else if (data.file) {
      sel.node().selectedIndex = ved.examples.indexOf(data.file) + 1;
      ved.open();
    }
  }, false);

  return ved;
};

proto.render = function(template, examples) {
  var ved = this,
      el = ved.$d3.html(template);

  // Specification drop-down menu               
  var sel = el.select('.sel_spec');
  sel.on('change', function() { ved.open(); });
  sel.append('option').text('Custom');
  sel.selectAll('optgroup')
    .data(Object.keys(examples))
   .enter().append('optgroup')
    .attr('label', function(key) { return key; })
   .selectAll('option.spec')
    .data(function(key) { return examples[key]; })
   .enter().append('option')
    .text(function(d) { return d.name; });

  // Renderer drop-down menu
  var ren = el.select('.sel_render');
  ren.on('change', function() { ved.renderer(); });
  ren.selectAll('option')
    .data(['Canvas', 'SVG'])
   .enter().append('option')
    .attr('value', function(d) { return d.toLowerCase(); })
    .text(function(d) { return d; });

  // Code Editor
  var editor = ved.editor = ace.edit(ved.$d3.select('.spec').node());
  editor.getSession().setMode('ace/mode/json');
  editor.getSession().setTabSize(2);
  editor.getSession().setUseSoftTabs(true);
  editor.setShowPrintMargin(false);
  editor.on('focus', function() {
    editor.setHighlightActiveLine(true);
    el.selectAll('.ace_gutter-active-line').style('background', '#DCDCDC');
    el.selectAll('.ace-tm .ace_cursor').style('visibility', 'visible');
  });
  editor.on('blur', function() {
    editor.setHighlightActiveLine(false);
    el.selectAll('.ace_gutter-active-line').style('background', 'transparent');
    el.selectAll('.ace-tm .ace_cursor').style('visibility', 'hidden');
    editor.clearSelection();
  });
  editor.$blockScrolling = Infinity;

  // Initialize application
  el.select('.btn_spec_format').on('click', function() { ved.format(); });
  el.select('.btn_spec_parse').on('click', function() { ved.parse(); });
  d3.select(window).on('resize', function() { ved.resize(); });
  ved.resize();
};

proto.open = function(spec) {
  var ved = this,
      desc = ved.$d3.select('.spec_desc');

  if (spec) {
    ved.editor.setValue(spec);
    ved.editor.gotoLine(0);
    desc.html('');
    ved.parse();
    return;
  }
  
  var sel = ved.$d3.select('.sel_spec').node(),
      idx = sel.selectedIndex;
  spec = d3.select(sel.options[idx]).datum();

  if (idx > 0) {
    d3.xhr(ved.uri(spec), function(error, response) {
      ved.editor.setValue(response.responseText);
      ved.editor.gotoLine(0);
      ved.parse(function() { desc.html(spec.desc || ''); });
    });
  } else {
    ved.editor.setValue('');
    ved.editor.gotoLine(0);
    desc.html('');
  }
};

proto.uri = function(entry) {
  return this.path + 'spec/' + entry.name + '.json';
};

proto.renderer = function() {
  var sel = this.$d3.select('.sel_render').node(),
      idx = sel.selectedIndex,
      ren = sel.options[idx].value;

  this.renderType = ren;
  this.parse();
};

proto.format = function() {
  var spec = JSON.parse(this.editor.getValue()),
      text = JSON.stringify(spec, null, 2);
  this.editor.setValue(text);
};

proto.parse = function(callback) {
  var ved = this, json, opt;
  try {
    opt = json = JSON.parse(ved.editor.getValue());
  } catch (e) {
    console.log(e);
    return;
  }

  if (!opt.spec && !opt.url && !opt.source) {
    // wrap spec for handoff to vega-embed
    opt = {spec: opt};
  }
  opt.actions = false;
  opt.renderer = opt.renderer || ved.renderType;
  opt.parameter_el = '.mod_params';

  if (ved.view) ved.view.destroy();
  ved.$d3.select('.mod_params').html('');
  ved.$d3.select('.spec_desc').html('');
  vg.embed('.vis', opt, function(view, spec) {
    ved.specType = (json === opt) ? 'embed' : 'vega';
    ved.spec = spec;
    ved.view = view;
    if (callback) callback(view);
  });
};

proto.resize = function(event) {
  this.editor.resize();
};

proto.params = function() {
  // Handle application parameters
  var p = url_params();
  if (p.renderer) {
    ren.node().selectedIndex = p.renderer.toLowerCase() === 'svg' ? 1 : 0;
    ved.renderType = p.renderer;
  }
  if (p.spec) {
    var spec = decodeURIComponent(p.spec),
        idx = ved.examples.indexOf(spec) + 1;

    if (idx > 0) {
      sel.node().selectedIndex = idx;
      ved.open();
    } else {
      try {
        JSON.parse(spec); // attempt parse to catch errors
        ved.open(spec);
      } catch (err) {
        console.error(err);
        console.error('Specification loading failed: ' + spec);
      }
    }
  }
};

function url_params() {
  var query = window.location.search.slice(1);
  if (query.slice(-1) === '/') query = query.slice(0,-1);
  return query
    .split('&')
    .map(function(x) { return x.split('='); })
    .reduce(function(a, b) {
      a[b[0]] = b[1]; return a;
    }, {});
}

module.exports = VegaEditor;
