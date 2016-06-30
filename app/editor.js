'use strict';

/*global location, window, d3, vl, vg, localStorage, document,
alert, console, VG_SPECS, VL_SPECS, ace, JSON3*/

var VEGA = 'vega';
var VEGA_LITE = 'vega-lite';
var COMPASSQL = 'compassql';

var ved = {
  version: '1.2.0',
  data: undefined,
  renderType: 'canvas',
  editor: {
    vega: null,
    'vega-lite': null
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

    ace.attr('class', 'ace_content');
    debug.init();
  } else if (ved.currentMode === VEGA_LITE) {
    ved.editor[VEGA].setOptions({
      readOnly: true,
      highlightActiveLine: false,
      highlightGutterLine: false
    });

    ace.attr('class', 'ace_content disabled');
  } else if (ved.currentMode === COMPASSQL) {
    // DO NOTHING
  } else {
    throw new Error('Unknown mode ' + ved.currentMode);
  }

  vge.attr('class', 'vega-editor ' + ved.currentMode);

  ved.editorVisibility();
  ved.getSelect().selectedIndex = 0;
  ved.select('');
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
  // FIXME
  var $d3 = ved.$d3,
      vgs = $d3.select('.vg-spec'),
      vls = $d3.select('.vl-spec'),
      toggle = $d3.select('.click_toggle_vega');

  if (ved.vgHidden && ved.currentMode === VEGA_LITE) {
    vgs.style('display', 'none');
    vls.style('flex', '1 1 auto');
    toggle.attr('class', 'click_toggle_vega up');
  } else if (ved.currentMode === COMPASSQL) {
    vgs.style('display', 'none');
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
      parse = mode === VEGA ? ved.parseVg : mode === VEGA_LITE ? ved.parseVl : ved.parseCql;

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
  } else if (mode === COMPASSQL) {
    ved.resize();
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

  var opt, source,
    value = ved.editor[VEGA].getValue();

  // delete cookie if editor is empty
  if (!value) {
    localStorage.removeItem('vega-spec');
    return;
  }

  try {
    opt = JSON.parse(ved.editor[VEGA].getValue());
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

  ved.resetView();
  var a = vg.embed('.vis', opt, function(err, result) {
    if (err) return callback(err);
    ved.spec = result.spec;
    ved.view = result.view;
    callback(null, result.view);
    if(ved.currentMode === VEGA) {
      debug.start();
    }
  });
};

ved.cql = { // namespace for CompassQL
  dataUrl: null,
  query: null,
  NUM_EXPAND: 2,
  views: {}
};

/**
 * Initialize schema and stats for CompassQL
 */
ved.cql.init = function(data) {
  var types = vg.util.type.inferAll(data);
  var fieldSchemas = vg.util.keys(types).map(function(field) {
    var primitiveType = types[field];
    var type = (primitiveType === 'number' || primitiveType === 'integer') ? 'quantitative' :
      primitiveType === 'date' ? 'temporal' : 'nominal';
    console.log('schema', field, type, primitiveType);

    return {
      field: field,
      type: type,
      primitiveType: types[field]
    };
  });
  ved.cql.schema = new cql.schema.Schema(fieldSchemas);
  var summary = vg.util.summary(data);
  ved.cql.stats = new cql.stats.Stats(summary);
};

function getRankingSummaryText(orderBy, score) {
  if (!score) {
    return null;
  }
  return orderBy + '=' + score.score + '\n\n' +
    score.features.map(function(feature) {
      return feature.score + ' : ' +feature.type + '.' + feature.feature;
    }).join(',\n');
}

/**  
* Recursively detach event listeners for all views in a group
* So the event signals can be garbage-collected when a group exits
*/
function detachViewsInGroup(root) {
  if (cql.nest.isSpecQueryModelGroup(root)) { // it's a group
    root.items.forEach(function(item) {
      detachViewsInGroup(item);
    });
  }
  else { // it's a SpecQueryModel
    detachView(root);
  }
}

/**
 * Detach event listeners for a single SpecQueryModel
 * So the event signals can be garbage-collected when an item exits
 */
function detachView(model) {
  var key = JSON.stringify(model.toSpec()); 
    if (ved.cql.views[key]) {
      ved.cql.views[key].destroy();
      delete ved.cql.views[key];
    }
}


ved.cql.renderGroups = function(sel, group, indexPrefix) {
  // select all children of sel
  var groupSelections = sel.selectAll(function() { return this.childNodes; })
    .data(
      // if not expand, only show the top item
      group.expand ? group.items : [group.items[0]],
      function (item) {
        return item.name || // group
          JSON.stringify(item.toSpec());    // model
      }
    );

  // unregister event listeners for exiting groups
  groupSelections.exit().each(function(group) {
    detachViewsInGroup(group);
  });

  groupSelections.exit().remove();

  var groupsEnter = groupSelections.enter()
    .append('div')
    .attr('class', 'vislistgroup');

  groupSelections.classed('collapsed', function(childGrp) {
      return !childGrp.expand;
    });

  var headersEnter = groupsEnter.append('span')
    .attr('class', 'groupheader')

  groupSelections.select('span.groupheader')
    .attr('title', function(childGrp) {
      var topItem = cql.nest.getTopItem(childGrp);
      var orderGroupBy = group.orderGroupBy;
      if (orderGroupBy) {
        var score = topItem.getRankingScore(orderGroupBy)
        return getRankingSummaryText(orderGroupBy, score);
      }
      return null;
    });

  headersEnter.append('span')
    .attr('class', 'grouptype');

  groupSelections.select('span.grouptype')
    .text(group.groupBy +': ');

  headersEnter.append('span')
    .attr('class', 'groupname');

  groupSelections.select('span.groupname')
    .text(function(childGrp) {
      return childGrp.name;
    });

  headersEnter.append('span')
    .attr('class', 'groupexpander')

  groupSelections.select('span.groupexpander')
    .text(function(childGrp) {
      return childGrp.items.length <= 1 ? '' : childGrp.expand ? ' [-] ' : ' [+] ';
    })
    .on('click', function(childGrp, gid) {
      childGrp.expand = !childGrp.expand;
      var groupElem = this.parentNode  // .groupheader
                          .parentNode; // .vislistgroup

      ved.cql.groupRenderer(indexPrefix).call(groupElem, childGrp, gid);

      d3.select(groupElem).select('.groupexpander').text(
        childGrp.items.length <= 1 ? '' :childGrp.expand ? ' [-] ' : ' [+] '
      );
      d3.select(groupElem).classed('collapsed', !childGrp.expand);
    });

  groupsEnter.append('div')
    .attr('class', 'grouplist');

  

  groupSelections.each(ved.cql.groupRenderer(indexPrefix));
};

ved.cql.groupRenderer = function(indexPrefix) {
  return function(group, gid) {
    var sel = d3.select(this).select('.grouplist');

    if (!group || group.items.length === 0) {
      return;
    }

    // render child item based on type
    if (group.items[0].items) { // SpecQueryModelGroup
      ved.cql.renderGroups(sel, group, (indexPrefix ? indexPrefix + '-' : '') + gid);
    } else { // SpecQueryModel
      ved.cql.renderItems(sel, group, (indexPrefix ? indexPrefix + '-' : '') + gid);
    }
  };
};

ved.cql.renderItems = function(sel, group, indexPrefix) {
  var selections = sel.selectAll(function() { return this.childNodes; })
      .data(
        // if not expand, only show the top item
        group.expand ? group.items : [group.items[0]],
        function (item) {
          return item.name || // group
            JSON.stringify(item.toSpec());    // model
        }
      );

  // unregister signals for exiting views
  selections.exit().each(function(model) {
    detachView(model);
  });

  selections.exit().remove();

  var enter = selections.enter()
      .append('div')
      .attr('class', 'vislistitem');

  enter.append('div')
    .attr('class', 'itemname')
    .text(function(d) {
      return d.toShorthand();
    });

  // set title to score (need to reset every time
  // since the same spec might have different score)
  selections.select('div.itemname')
    .attr('title', function(d) {
      var orderBy = ved.cql.query.orderBy;

      return getRankingSummaryText(orderBy, d.getRankingScore(orderBy));
    });

  enter.append('div')
    .attr('id', function(_, index) { return 'vis-' + indexPrefix + '-' + index; })
    .each(function(model, index) {
      var spec = model.toSpec();
      var id = '#vis-' + indexPrefix + '-' + index;
      var opt = {
        spec: spec,
        renderer: ved.renderType,
        mode: 'vega-lite',
        actions: {export: false}
      };
      vg.embed(id, opt, function(err, result) {
        if(err) {
          console.error("[CompassQL]", err);
          return;
        }

        // store current view
        var key = JSON.stringify(spec);
        ved.cql.views[key] = result.view;
      });
    });
  
  
};

ved.cql.generate = function(query) {
  var startTime = Date.now();
  var rootGroup = cql.query(query, ved.cql.schema, ved.cql.stats);
  var endTime = Date.now();
  console.log('Query time:', (endTime - startTime), 'milliseconds');

  ved.cql.query = query; // storing for later reference
  console.log('CompassQL', rootGroup.items);

  rootGroup.expand = true;
  rootGroup.items.forEach(function(answer, index) {
    answer.expand = index < ved.cql.NUM_EXPAND;
  });

  d3.select('.vislist').datum(rootGroup)
    .each(ved.cql.groupRenderer(''));
};

ved.parseCql = function(callback) {
  if (!callback) {
    callback = function(err) {
      if (err) {
        // FIXME is this the right thing to do for parseCql
        if (ved.view) ved.view.destroy();
        console.error(err);
      }
    };
  }

  var query;
  var value = ved.editor[COMPASSQL].getValue();

  if (!value) {
    localStorage.removeItem('compassql-spec');
    return;
  }

  try {
    query = JSON.parse(value);
  } catch (e) {
    return callback(e);
  }

  if (ved.getSelect().selectedIndex === 0) {
    localStorage.setItem('compassql-spec', value);
  }

  var data = query.spec.data;
  if (data) {
    if (data.url) {
      if (data.url !== ved.cql.dataUrl) {
        ved.cql.dataUrl = data.url;
        d3.json('app/' + data.url, function(err, data) {
          ved.cql.init(data);
          ved.cql.generate(query);
        });
      } else {
        // no need to recalculate the stats
        ved.cql.generate(query);
      }
    } else if (data.values) {
      ved.cql.dataUrl = null;
      ved.cql.init(data);
      ved.cql.generate(query);
    }
  } else {
    console.error('no data specified');
    return;
  }
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
  ved.editor[VEGA_LITE].resize();
  ved.editor[COMPASSQL].resize();
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

    // CompassQL specification drop-down menu
    var vlSel = el.select('.sel_compassql_spec');
    vlSel.on('change', ved.setUrlAfter(ved.select));
    vlSel.append('option').text('Custom');
    vlSel.selectAll('optgroup')
      .data(Object.keys(CQL_SPECS))
     .enter().append('optgroup')
      .attr('label', function(key) { return key; })
     .selectAll('option.spec')
      .data(function(key) { return CQL_SPECS[key]; })
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

    // Vega, Vega-lite, or CompassQL mode
    var mode = el.select('.sel_mode');
    mode.on('change', ved.setUrlAfter(ved.mode));

    // Code Editors
    var vlEditor = ved.editor[VEGA_LITE] = ace.edit(el.select('.vl-spec').node());
    var vgEditor = ved.editor[VEGA] = ace.edit(el.select('.vg-spec').node());
    var cqlEditor = ved.editor[COMPASSQL] = ace.edit(el.select('.cql-spec').node());

    [vlEditor, vgEditor, cqlEditor].forEach(function(editor) {
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
    el.select('.btn_cql_parse').on('click', ved.setUrlAfter(ved.parseCql));
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

    var getIndexes = function(obj) {
      return Object.keys(obj).reduce(function(a, k) {
        return a.concat(obj[k].map(function(d) { return d.name; }));
      }, []);
    };

    ved.specs = {};
    ved.specs[VEGA] = getIndexes(VG_SPECS);
    ved.specs[VEGA_LITE] = getIndexes(VL_SPECS);
    ved.specs[COMPASSQL] = getIndexes(CQL_SPECS);

    // Handle application parameters
    var p = ved.params();
    if (p.renderer) {
      ren.node().selectedIndex = p.renderer.toLowerCase() === 'svg' ? 1 : 0;
      ved.renderType = p.renderer;
    }

    if (p.mode) {
      mode.node().selectedIndex = p.mode.toLowerCase() === COMPASSQL ? 2 :
        p.mode.toLowerCase() === VEGA_LITE ? 1 : 0;
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
