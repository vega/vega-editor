'use strict';

/*global location, window, d3, vl, vg, localStorage, document,
alert, console, VG_SPECS, VL_SPECS, ace, JSON3*/

var VEGA = 'vega';
var VEGA_LITE = 'vega-lite';
var VEGA_CONFIG = 'vega-config';

var ved = {
  version: '1.2.0',
  data: undefined,
  renderType: 'canvas',
  editor: {
    vega: null,
    'vega-lite': null,
    config: null
  },
  currentMode: null,
  vgHidden: true  // vega editor hidden in vl mode
};

ved.isPathAbsolute = function(path) {
  return /^(?:\/|[a-z]+:\/\/)/.test(path);
};

ved.params = function() {
  var query = location.search.slice(1);
  if (query.slice(-1) === '/') query = query.slice(0,-1);
  return query
    .split('&')
    .map(function(x) { return x.split('='); })
    .reduce(function(a, b) {
      a[b[0]] = b[1]; return a;
    }, {});
};

ved.mode = function() {
  var $d3  = ved.$d3,
      sel = $d3.select('.sel_mode').node(),
      vge = $d3.select('.vega-editor'),
      ace = $d3.select('.vg-spec .ace_content'),
      idx = sel.selectedIndex,
      newMode = sel.options[idx].value,
      spec;

  if (ved.currentMode === newMode) return;
  ved.currentMode = newMode;

  if (ved.currentMode === VEGA) {
    ved.editor[VEGA].setOptions({
      readOnly: false,
      highlightActiveLine: true,
      highlightGutterLine: true
    });

    ved.editor[VEGA].session.setFoldStyle("markbeginend");
    ved.editor[VEGA].setShowFoldWidgets("markbeginend");

    d3.json("vendor/vega-schema.json", function(data) { 
      ved.schema = data;
      ved.autocomplete();
    });

    ace.attr('class', 'ace_content');
    debug.init();
  } else if (ved.currentMode === VEGA_LITE) {
    ved.editor[VEGA].setOptions({
      readOnly: true,
      highlightActiveLine: false,
      highlightGutterLine: false
    });

    ace.attr('class', 'ace_content disabled');
  } else {
    throw new Error('Unknown mode ' + ved.currentMode);
  }

  vge.attr('class', 'vega-editor ' + ved.currentMode);

  ved.editorVisibility();
  ved.getSelect().selectedIndex = 0;
  ved.select('');
};

ved.resetAutocompleters = function() {
  ved.editor[VEGA].completers = ved.editor[VEGA].completers.filter(function(c) { return c.getDocTooltip; });
};

ved.defaultAutocompleters = function() {
  if(ved.spec.data) ved.addAutocompleter(ved.spec.data.map(function(obj) { return obj.name; }), "data");
  if(ved.spec.signals) ved.addAutocompleter(ved.spec.signals.map(function(obj) { return obj.name; }), "signal");
  if(ved.spec.scales) ved.addAutocompleter(ved.spec.scales.map(function(obj) { return obj.name; }), "scale");
  (ved.view.model().data() || []).forEach(function(data) {
    ved.addAutocompleter(Object.keys(data.values()[0]), data.name());
  });

  // Add the main vega autocompleter.
  ved.VegaAutocompleter();
};

ved.addAutocompleter = function(wordList, category) {

  // NOTE: I think we can add a "score" property to the return from the callback that determines
  //       how high in the list it should be based on the relevant scope and such.
  // Note: If the score is zero, then it won't appear. We can use this to hide certain values that are inappropriate.

  var staticWordCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
      callback(null, wordList.map(function(word) {
          return {
              caption: word,
              value: word,
              meta: category
          };
      }));
    }
  }
  ved.editor[VEGA].completers.push(staticWordCompleter);
};

ved.VegaAutocompleter = function() {
  var staticWordCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
      var tokens = getTokens(ved.editor[VEGA].getSession().getDocument().getLine(pos.row));
      var scope = getScope(pos.row)[0];
      var wordList = {};
      Object.keys(words).map(function(word) {
        wordList[word] = getScore(word, words[word].scope, prefix, tokens, scope);
      });
      //console.log("prefix: (", prefix, ") tokens: (", tokens, ") scope: (", scope, ")")
      callback(null, Object.keys(wordList).map(function(word) {
          return {
              caption: word,
              value: word,
              score: wordList[word],
              meta: "vega"
          };
      }));
    }
  }
  ved.editor[VEGA].completers.push(staticWordCompleter);
};
  
function getTokens(string) {
  var clean = string.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]]/g,"").replace(/\s{2,}/g," ");
  var tokens = clean.split("\"");
  return tokens.filter(function(value) { return value != " " && value != ""; })
};

function getScope(row) {
  var session = ved.editor[VEGA].getSession();
  var scope = session.getParentFoldRangeData(row);
  if(scope.range == false) return ["spec"];
  var tokens = getTokens(session.getDocument().getLine(scope.range.start.row));
  if(tokens.length == 0) tokens = getScope(scope.range.start.row);
  return tokens;
};

function getScore(word, wordScopes, prefix, tokens, scope) {
  var score = 0;
  //if(wordScopes.indexOf(scope) != -1) console.log("Word (" + word + ") in scope.");
  if(wordScopes.indexOf(scope) != -1) score += 50;      // Increase if the word scope contains the current scope.
  if(word.indexOf(prefix) != -1) score += 50;           // Increase if word has prefix.
  if(tokens.indexOf(word) != -1) score -= 25;           // Decrease if word already in the line.
  return score;
};

var snippets = [];
var words = {};
var visited = [];
var missing = [];
function extract(object, name, parent) {
  //console.log("EXTRACTING: ", name, object)
  createWord(object, name, parent);

  if(object.required) createSnippet(object, name, parent);

  // Process the property's children
  if(object.$ref) {
    if(visited.indexOf(object.$ref) != -1) {
      createWord(object, name, parent);
    } else {
      visited.push(object.$ref);
      var reference = object.$ref.split("/");
      extract(ved.schema[reference[1]][reference[2]], name, parent);
    }
  } 
  else if(object.allOf) {
    object.allOf.forEach(function(el) {
      extract(el, name, parent);
    });
  }
  else if(object.anyOf) {
    object.anyOf.forEach(function(el) {
      extract(el, name, parent);
    });
  }
  else if(object.oneOf) {
    object.oneOf.forEach(function(el) {
      extract(el, name, parent);
    });
  }
  else if(object.items) {
    createSnippet(object, name, name);
    extract(object.items, name, name);
  }
  else if(object.additionalProperties) {
    extract(object.additionalProperties, name, parent);
  }
  else if(object.enum) {
    object.enum.forEach(function(el) {
      createWord(el, el, parent);
    });
  }
  else if(object.type == "boolean") {
    createWord("true", "true", name);
    createWord("false", "false", name);
  }
  else if(object.type == "null") {
    createWord("null", "null", name);
  }
  else if(object.properties) {
    Object.keys(object.properties).forEach(function(property) {
      extract(object.properties[property], property, name);
    });
  } 
  else if(object.type == "number" || object.type == "string" || object.type == "array"
         || object.description || object.not || object.required
         || (object.type && object.type.length == 2) || Object.keys(object).length == 0) {
    // There is nothing to do here.
  } 
  else {
    console.log("  Confused?", object, "(", name, ") for parent: ", parent);
  }
};

function createSnippet(object, name, parent) {
  //console.log("  create snippet: ", object, name, parent);
  var snippet = {"content": "MISSING"};
  if(object.type == "object") snippet = createObjectSnippet(object, name, parent);
  if(object.type == "array") snippet = createArraySnippet(object, name, parent);

  var snippetExists = snippets.map(function(snip) { 
    return snip.content; 
  }).indexOf(snippet.content) != -1;
  if(!snippetExists && !(snippet.content == "MISSING")) snippets.push(snippet);
};

function createObjectSnippet(object, name, parent) {
  var title = object.title || name;
  var isTransform = title.indexOf("transform") != -1;
  var string = "{";
  var index = 0;
  object.required.forEach(function(property) {
    if(isTransform && property == "type") {
      var transform = object.properties.type.enum[0];
      string += "\"" + property + "\": \"" + transform + "\"";
      if(object.required.length > 1) string += ", ";
    } else {
      string += "\"" + property + "\": ${" + ++index + ":" + property + "}";
      var length = isTransform ? object.required.length - 1 : object.required.length;
      string += index == length ? "" : ", ";
    }
  });
  string += "}";

  var snippet = {"name": title, "content": string};
  return snippet;
};

function createArraySnippet(object, name, parent) { 
  if(object.items.type == "string" || object.items.type == "number") {
    var string = "\"field\": [${1:" + object.items.type + "}]";
    var snippet = {"name": name, "content": string};
    return snippet;
  } else {
    missing.push(name);
    return {"content": "MISSING"}
  }
};

function createWord(object, name, parent) {
  if(name == parent) return;
  if(!words[name]) {
    words[name] = {"scope": [parent]};
  } else if(words[name] && words[name].scope.indexOf(parent) == -1) {
    words[name].scope.push(parent);
  }
};

ved.autocomplete = function() {
  if(ved.currentMode === VEGA) {
    ved.editor[VEGA].setOptions({
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });

    var reference = ved.schema.$ref.split("/");
    extract(ved.schema[reference[1]][reference[2]], reference[2], "spec");
    console.log("Words", words)
    var objects = Object.keys(words).map(function(word) { 
      return obj = {"word": word, "length": words[word].scope.length, "scopes": words[word].scope}
    });
    var lengths = objects.map(function(obj) { return obj.length; });
    console.log("Max", Math.max(...lengths), objects);
    console.log("Missing snippets", missing);


    // NOTE: The snippet variables have the class "ace_snippet-marker" which I can probably modify
    //       to have the visual salience I want.

    /* TODO: This is *almost* what I want.
     *       The problem is that when I do this, it doesn't actually insert a { which would
     *       be annoying if you were actually writing something by hand. Instead, I want to
     *       insert the character, and *only* show the snippets with this key command.
     */
    //ved.editor[VEGA].commands.bindKey("{", "startAutocomplete");

    console.log("Snippets", snippets)

    // Snippet information
    // Based off: http://blog.rymo.io/2014/07/integrating-the-ace-editor-into-your-project/

    var snippetManager = ace.require("ace/snippets").snippetManager;
    snippetManager.files = {};
    var obj = {"scope": "json", "snippetText": ""};
    snippetManager.files["ace/mode/json"] = obj;

    obj.snippets = snippets;
    snippetManager.register(obj.snippets, obj.scope);

    // TODO: Note, when you don't reset the completers like this, there is a "local" completer that fills things locally.
    // This *might* be really helpful, but I wanted something less cluttered for now.
    ved.editor[VEGA].completers = ved.editor[VEGA].completers.filter(function(c) { return c.getDocTooltip; });
  }
};

ved.switchToVega = function() {
  var sel = ved.$d3.select('.sel_mode').node(),
      spec = ved.editor[VEGA].getValue();
  sel.selectedIndex = 0;
  ved.mode();
  ved.select(spec);
};

// Changes visibility of vega editor in vl mode
ved.editorVisibility = function() {
  var $d3 = ved.$d3,
      vgs = $d3.select('.vg-spec'),
      vls = $d3.select('.vl-spec'),
      toggle = $d3.select('.click_toggle_vega');

  if (ved.vgHidden && ved.currentMode === VEGA_LITE) {
    vgs.style('display', 'none');
    vls.style('flex', '1 1 auto');
    toggle.attr('class', 'click_toggle_vega up');
  } else {
    vgs.style('display', 'block');
    ved.resizeVlEditor();
    toggle.attr('class', 'click_toggle_vega down');
  }
  ved.resize();
};

ved.select = function(spec) {
  var $d3 = ved.$d3,
      mode = ved.currentMode,
      desc = $d3.select('.spec_desc'),
      editor = ved.editor[mode],
      sel = ved.getSelect(),
      parse = mode === VEGA ? ved.parseVg : ved.parseVl;

  if (spec) {
    editor.setValue(spec);
    editor.gotoLine(0);
    desc.html('');
    parse();
    ved.resizeVlEditor();
    return;
  }

  var idx = sel.selectedIndex;
  spec = d3.select(sel.options[idx]).datum();

  if (idx > 0) {
    d3.xhr(ved.uri(spec), function(error, response) {
      editor.setValue(response.responseText);
      editor.gotoLine(0);
      parse(function(err) {
        if (err) console.error(err);
        desc.html(spec.desc || '');
      });
    });
  } else {
    editor.setValue('');
    editor.gotoLine(0);
    ved.editor[VEGA].setValue('');
    ved.resetView();
  }

  if (mode === VEGA) {
    ved.resize();
  } else if (mode === 'vl') {
    ved.resizeVlEditor();
  }
};

ved.uri = function(entry) {
  return ved.path + 'spec/' + ved.currentMode +
    '/' + entry.name + '.json';
};

ved.renderer = function() {
  var sel = ved.$d3.select('.sel_render').node(),
      idx = sel.selectedIndex,
      ren = sel.options[idx].value;

  ved.renderType = ren;
  ved.parseVg();
};

ved.format = function() {
  for (var key in ved.editor) {
    var editor = ved.editor[key];
    var text = editor.getValue();
    if (text.length) {
      var spec = JSON.parse(text);
      text = JSON3.stringify(spec, null, 2, 60);
      editor.setValue(text);
      editor.gotoLine(0);
    }
  }
};

ved.parseVl = function(callback) {
  var spec, source,
    value = ved.editor[VEGA_LITE].getValue();

  // delete cookie if editor is empty
  if (!value) {
    localStorage.removeItem('vega-lite-spec');
    return;
  }

  try {
    spec = JSON.parse(value);
  } catch (e) {
    console.log(e);
    return;
  }

  if (ved.getSelect().selectedIndex === 0) {
    localStorage.setItem('vega-lite-spec', value);
  }

  // TODO: display error / warnings
  var vgSpec = vl.compile(spec).spec;
  var text = JSON3.stringify(vgSpec, null, 2, 60);
  ved.editor[VEGA].setValue(text);
  ved.editor[VEGA].gotoLine(0);

  // change select for vega to Custom
  var vgSel = ved.$d3.select('.sel_vega_spec');
  vgSel.node().selectedIndex = 0;

  ved.parseVg(callback);
};

ved.parseVg = function(callback) {
  if (!callback) {
    callback = function(err) {
      if (err) {
        if (ved.view) ved.view.destroy();
        console.error(err);
      }
    };
  }

  var value = ved.editor[VEGA].getValue(),
    config  = ved.editor[VEGA_CONFIG].getValue() || '{}',
    opt;

  // delete cookie if editor is empty
  if (!value) {
    localStorage.removeItem('vega-spec');
    return;
  }

  try {
    opt = JSON.parse(value);
    config = JSON.parse(config);
  } catch (e) {
    return callback(e);
  }

  var tracking = {
    "name": "group_vgTRACKING",
    "streams": [
      {"type": "mousemove", "expr": "eventGroup()"}
    ]
  }
  if(opt.signals) {
    opt.signals.push(tracking);
  } else {
    opt.signals = [tracking]
  }

  if (ved.getSelect().selectedIndex === 0 && ved.currentMode === VEGA) {
    // Only save the Vega spec to local storage if the mode is Vega since parseVl() also calls this method. 
    localStorage.setItem('vega-spec', value);
  }

  if (!opt.spec && !opt.url && !opt.source) {
    // wrap spec for handoff to vega-embed
    opt = {spec: opt};
  }
  opt.actions = false;
  opt.renderer = opt.renderer || ved.renderType;
  opt.parameter_el = '.mod_params';
  opt.config = config;

  ved.resetView();
  var a = vg.embed('.vis', opt, function(err, result) {
    if (err) return callback(err);
    ved.spec = result.spec;
    ved.view = result.view;
    callback(null, result.view);
    ved.resetAutocompleters();
    ved.defaultAutocompleters();

    if(ved.currentMode === VEGA) {
      debug.start();
    }
  });
};

ved.resetView = function() {
  var $d3 = ved.$d3;
  if (ved.view) ved.view.destroy();
  $d3.select('.mod_params').html('');
  $d3.select('.spec_desc').html('');
  $d3.select('.vis').html('');
};

ved.resize = function(event) {
  ved.editor[VEGA].resize();
  ved.editor[VEGA_CONFIG].resize();
  ved.editor[VEGA_LITE].resize();
};

ved.resizeVlEditor = function() {
  if (ved.vgHidden || ved.currentMode !== VEGA_LITE)
    return;

  var editor = ved.editor[VEGA_LITE];
  var height = editor.getSession().getDocument().getLength() *
  editor.renderer.lineHeight + editor.renderer.scrollBar.getWidth();

  if (height > 600) {
    return;
  } else if (height < 200) {
    height = 200;
  }

  ved.$d3.select('.vl-spec')
    .style('height', height + 'px')
    .style('flex', 'none');
  ved.resize();
};

ved.setPermanentUrl = function() {
  var params = [];
  params.push('mode=' + ved.currentMode);

  var sel = ved.getSelect();
  var idx = sel.selectedIndex,
    spec = d3.select(sel.options[idx]).datum();

  if (spec) {
    params.push('spec=' + spec.name);
  }

  if (!ved.vgHidden && ved.currentMode === VEGA_LITE) {
    params.push('showEditor=1');
  }

  if (ved.$d3.select('.sel_render').node().selectedIndex === 1) {
    params.push('renderer=svg');
  }

  var path = location.protocol + '//' + location.host + location.pathname;
  var url = path + '?' + params.join('&');

  window.history.replaceState("", document.title, url);
};

ved.export = function() {
  var ext = ved.renderType === 'canvas' ? 'png' : 'svg',
      url = ved.view.toImageURL(ext);

  var el = d3.select(document.createElement('a'))
    .attr('href', url)
    .attr('target', '_blank')
    .attr('download', (ved.spec.name || VEGA) + '.' + ext)
    .node();

  var evt = document.createEvent('MouseEvents');
  evt.initMouseEvent('click', true, true, document.defaultView, 1, 0, 0, 0, 0,
    false, false, false, false, 0, null);
  el.dispatchEvent(evt);
};

ved.setUrlAfter = function(func) {
  return function() {
    func();
    ved.setPermanentUrl();
  };
};

ved.goCustom = function(func) {
  return function() {
    ved.getSelect().selectedIndex = 0;
    func();
  };
};

ved.getSelect = function() {
  return ved.$d3.select('.sel_' + ved.currentMode + '_spec').node();
};

ved.init = function(el, dir) {
  // Set base directory
  var PATH = dir || 'app/';
  vg.config.load.baseURL = PATH;
  ved.path = PATH;

  el = (ved.$d3 = d3.select(el));

  d3.text(PATH + 'template.html', function(err, text) {
    el.html(text);

    // Vega specification drop-down menu
    var vgSel = el.select('.sel_vega_spec');
    vgSel.on('change', ved.setUrlAfter(ved.select));
    vgSel.append('option').text('Custom');
    vgSel.selectAll('optgroup')
      .data(Object.keys(VG_SPECS))
     .enter().append('optgroup')
      .attr('label', function(key) { return key; })
     .selectAll('option.spec')
      .data(function(key) { return VG_SPECS[key]; })
     .enter().append('option')
      .text(function(d) { return d.name; });

    // Vega-lite specification drop-down menu
    var vlSel = el.select('.sel_vega-lite_spec');
    vlSel.on('change', ved.setUrlAfter(ved.select));
    vlSel.append('option').text('Custom');
    vlSel.selectAll('optgroup')
      .data(Object.keys(VL_SPECS))
     .enter().append('optgroup')
      .attr('label', function(key) { return key; })
     .selectAll('option.spec')
      .data(function(key) { return VL_SPECS[key]; })
     .enter().append('option')
      .attr('label', function(d) { return d.title; })
      .text(function(d) { return d.name; });

    // Renderer drop-down menu
    var ren = el.select('.sel_render');
    ren.on('change', ved.setUrlAfter(ved.renderer));
    ren.selectAll('option')
      .data(['Canvas', 'SVG'])
     .enter().append('option')
      .attr('value', function(d) { return d.toLowerCase(); })
      .text(function(d) { return d; });

    // Vega or Vega-lite mode
    var mode = el.select('.sel_mode');
    mode.on('change', ved.setUrlAfter(ved.mode));

    // Code Editors
    var vlEditor = ved.editor[VEGA_LITE] = ace.edit(el.select('.vl-spec').node());
    var vgEditor = ved.editor[VEGA] = ace.edit(el.select('.vg-spec').node());
    var vcEditor = ved.editor[VEGA_CONFIG] = ace.edit(el.select('.vc-spec').node());

    [vlEditor, vgEditor, vcEditor].forEach(function(editor) {
      editor.getSession().setMode('ace/mode/json');
      editor.getSession().setTabSize(2);
      editor.getSession().setUseSoftTabs(true);
      editor.setShowPrintMargin(false);
      editor.on('focus', function() {
        d3.selectAll('.ace_gutter-active-line').style('background', '#DCDCDC');
        d3.selectAll('.ace-tm .ace_cursor').style('visibility', 'visible');
      });
      editor.on('blur', function() {
        d3.selectAll('.ace_gutter-active-line').style('background', 'transparent');
        d3.selectAll('.ace-tm .ace_cursor').style('visibility', 'hidden');
        editor.clearSelection();
      });
      editor.$blockScrolling = Infinity;
      d3.select(editor.textInput.getElement())
        .on('keydown', ved.goCustom(ved.setPermanentUrl));

      editor.setValue('');
      editor.gotoLine(0);
    });

    // adjust height of vl editor based on content
    vlEditor.on('input', ved.resizeVlEditor);
    ved.resizeVlEditor();

    // Initialize application
    el.select('.btn_spec_format').on('click', ved.format);
    el.select('.btn_vg_parse').on('click', ved.setUrlAfter(ved.parseVg));
    el.select('.btn_vl_parse').on('click', ved.setUrlAfter(ved.parseVl));
    el.select('.btn_to_vega').on('click', ved.setUrlAfter(function() {
      d3.event.preventDefault();
      ved.switchToVega();
    }));
    el.select('.btn_export').on('click', ved.export);
    el.select('.vg_pane').on('click', ved.setUrlAfter(function() {
      ved.vgHidden = !ved.vgHidden;
      ved.editorVisibility();
    }));
    d3.select(window).on('resize', ved.resize);
    ved.resize();
    config.init();

    var getIndexes = function(obj) {
      return Object.keys(obj).reduce(function(a, k) {
        return a.concat(obj[k].map(function(d) { return d.name; }));
      }, []);
    };

    ved.specs = {};
    ved.specs[VEGA] = getIndexes(VG_SPECS);
    ved.specs[VEGA_LITE] = getIndexes(VL_SPECS);

    // Handle application parameters
    var p = ved.params();
    if (p.renderer) {
      ren.node().selectedIndex = p.renderer.toLowerCase() === 'svg' ? 1 : 0;
      ved.renderType = p.renderer;
    }

    if (p.mode) {
      mode.node().selectedIndex = p.mode.toLowerCase() === VEGA_LITE ? 1 : 0;
    }
    ved.mode();

    if (ved.currentMode === VEGA_LITE) {
      if (p.showEditor) {
        ved.vgHidden = false;
        ved.editorVisibility();
      }
    }

    if (p.spec) {
      var spec = decodeURIComponent(p.spec),
          idx = ved.specs[ved.currentMode].indexOf(spec) + 1;

      if (idx > 0) {
        ved.getSelect().selectedIndex = idx;
        ved.select();
      } else {
        try {
          var json = JSON.parse(decodeURIComponent(spec));
          ved.select(spec);
          ved.format();
        } catch (err) {
          console.error(err);
          console.error('Specification loading failed: ' + spec);
        }
      }
    }

    // Load content from cookies if no example has been loaded
    var key = ved.currentMode + '-spec';
    if (ved.getSelect().selectedIndex === 0 && localStorage.getItem(key)) {
      ved.select(localStorage.getItem(key));
    }

    // Handle post messages
    window.addEventListener('message', function(evt) {
      var data = evt.data;
      console.log('[Vega-Editor] Received Message', evt.origin, data);

      // send acknowledgement
      if (data.spec || data.file) {
        evt.source.postMessage(true, '*');
      }

      // set vg or vl mode
      if (data.mode) {
        mode.node().selectedIndex =
          data.mode.toLowerCase() === VEGA_LITE ? 1 : 0;
        ved.mode();
      }

      // load spec
      if (data.spec) {
        ved.select(data.spec);
      } else if (data.file) {
        ved.getSelect().selectedIndex = ved.specs[ved.currentMode].indexOf(data.file) + 1;
        ved.select();
      }
    }, false);
  });
};
