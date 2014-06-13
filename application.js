(function() {
  var bindBatmanDescriptor, cloneDescriptor, reactComponentForRoutingKeyAndAction, tagFunc, tagName, _base, _fn, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  (_base = Batman.DOM).React || (_base.React = {});

  Batman.DOM.React.AbstractBinding = (function() {
    var get_dot_rx, get_rx, keypath_rx;

    keypath_rx = /(^|,)\s*(?:(true|false)|("[^"]*")|(\{[^\}]*\})|(([0-9\_\-]+[a-zA-Z\_\-]|[a-zA-Z])[\w\-\.\?\!\+]*))\s*(?=$|,)/g;

    get_dot_rx = /(?:\]\.)(.+?)(?=[\[\.]|\s*\||$)/;

    get_rx = /(?!^\s*)\[(.*?)\]/g;

    AbstractBinding.prototype.getFilteredValue = function() {
      var result, self, unfilteredValue;
      unfilteredValue = this.getUnfilteredValue();
      self = this;
      if (this.filterFunctions.length > 0) {
        result = this.filterFunctions.reduce(function(value, fn, i) {
          var args;
          args = self.filterArguments[i].map(function(argument) {
            if (argument._keypath) {
              return self.lookupKeypath(argument._keypath);
            } else {
              return argument;
            }
          });
          args.unshift(value);
          while (args.length < (fn.length - 1)) {
            args.push(void 0);
          }
          args.push(self);
          return fn.apply(self.view, args);
        }, unfilteredValue);
        return result;
      } else {
        return unfilteredValue;
      }
    };

    AbstractBinding.prototype.getUnfilteredValue = function() {
      return this._unfilteredValue(this.key);
    };

    AbstractBinding.prototype._unfilteredValue = function(key) {
      if (key) {
        return this.lookupKeypath(key);
      } else {
        return this.value;
      }
    };

    AbstractBinding.prototype.lookupKeypath = function(keypath) {
      return this.descriptor.contextObserver.getContext(keypath);
    };

    function AbstractBinding(descriptor, bindingName, keypath, attrArg) {
      this.descriptor = descriptor;
      this.bindingName = bindingName;
      this.keypath = keypath;
      this.attrArg = attrArg;
      this.tagName = this.descriptor.type;
      this.parseFilter();
      this.filteredValue = this.getFilteredValue();
    }

    AbstractBinding.prototype.parseFilter = function() {
      var args, e, filter, filterName, filterString, filters, key, keypath, orig, split;
      this.filterFunctions = [];
      this.filterArguments = [];
      keypath = this.keypath;
      while (get_dot_rx.test(keypath)) {
        keypath = keypath.replace(get_dot_rx, "]['$1']");
      }
      filters = keypath.replace(get_rx, " | get $1 ").replace(/'/g, '"').split(/(?!")\s+\|\s+(?!")/);
      try {
        key = this.parseSegment(orig = filters.shift())[0];
      } catch (_error) {
        e = _error;
        Batman.developer.warn(e);
        Batman.developer.error("Error! Couldn't parse keypath in \"" + orig + "\". Parsing error above.");
      }
      if (key && key._keypath) {
        this.key = key._keypath;
      } else {
        this.value = key;
      }
      if (filters.length) {
        while (filterString = filters.shift()) {
          split = filterString.indexOf(' ');
          if (split === -1) {
            split = filterString.length;
          }
          filterName = filterString.substr(0, split);
          args = filterString.substr(split);
          filter = Batman.Filters[filterName];
          this.filterFunctions.push(filter);
          try {
            this.filterArguments.push(this.parseSegment(args));
          } catch (_error) {
            e = _error;
            Batman.developer.error("Bad filter arguments \"" + args + "\"!");
          }
        }
        return true;
      }
    };

    AbstractBinding.prototype.parseSegment = function(segment) {
      segment = segment.replace(keypath_rx, function(match, start, bool, string, object, keypath, offset) {
        var replacement;
        if (start == null) {
          start = '';
        }
        replacement = keypath ? '{"_keypath": "' + keypath + '"}' : bool || string || object;
        return start + replacement;
      });
      return JSON.parse("[" + segment + "]");
    };

    AbstractBinding.prototype.safelySetProps = function(props) {
      return Batman.mixin(this.descriptor.props, props);
    };

    return AbstractBinding;

  })();

  Batman.DOM.React.AddClassBinding = (function(_super) {
    __extends(AddClassBinding, _super);

    function AddClassBinding() {
      return AddClassBinding.__super__.constructor.apply(this, arguments);
    }

    AddClassBinding.prototype.applyBinding = function() {
      var className;
      if (this.filteredValue) {
        className = this.descriptor.props.className || "";
        className += " " + this.attrArg;
        this.safelySetProps({
          className: className
        });
      }
      return this.descriptor;
    };

    return AddClassBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.BindAttributeBinding = (function(_super) {
    __extends(BindAttributeBinding, _super);

    function BindAttributeBinding() {
      return BindAttributeBinding.__super__.constructor.apply(this, arguments);
    }

    BindAttributeBinding.prototype.applyBinding = function() {
      var newProps;
      newProps = {};
      newProps[this.attrArg] = this.filteredValue;
      this.safelySetProps(newProps);
      return this.descriptor;
    };

    return BindAttributeBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.BindBinding = (function(_super) {
    __extends(BindBinding, _super);

    function BindBinding() {
      return BindBinding.__super__.constructor.apply(this, arguments);
    }

    BindBinding.prototype.applyBinding = function() {
      var inputType, newProps;
      switch (this.tagName) {
        case "input":
          inputType = this.descriptor.props.type.toLowerCase();
          newProps = (function() {
            switch (inputType) {
              case "checkbox":
                if (!!this.filteredValue) {
                  return {
                    checked: true
                  };
                } else {
                  return {};
                }
                break;
              case "radio":
                if ((this.filteredValue != null) && this.filteredValue === this.descriptor.props.value) {
                  return {
                    checked: true
                  };
                } else {
                  return {};
                }
                break;
              default:
                return {
                  value: this.filteredValue
                };
            }
          }).call(this);
          newProps.onChange = this.updateKeypath();
          break;
        case "select":
          newProps = {
            value: this.filteredValue,
            onChange: this.updateKeypath()
          };
          break;
        default:
          if (this.filteredValue != null) {
            this.descriptor.children = "" + this.filteredValue;
            newProps = {};
          }
      }
      this.safelySetProps(newProps);
      return this.descriptor;
    };

    BindBinding.prototype.updateKeypath = function(keypath) {
      var observer;
      if (keypath == null) {
        keypath = this.keypath;
      }
      observer = this.descriptor.contextObserver;
      return (function(_this) {
        return function(e) {
          var value;
          value = (function() {
            switch (e.target.type.toUpperCase()) {
              case "CHECKBOX":
                return e.target.checked;
              default:
                return e.target.value;
            }
          })();
          reactDebug("updating " + keypath + " to: ", value);
          return observer.setContext(keypath, value);
        };
      })(this);
    };

    return BindBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.ContextAttributeBinding = (function(_super) {
    __extends(ContextAttributeBinding, _super);

    function ContextAttributeBinding() {
      return ContextAttributeBinding.__super__.constructor.apply(this, arguments);
    }

    ContextAttributeBinding.prototype.applyBinding = function() {
      this.descriptor.contextObserver.setContext(this.attrArg, this.filteredValue || null);
      return this.descriptor;
    };

    return ContextAttributeBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.EventBinding = (function(_super) {
    __extends(EventBinding, _super);

    function EventBinding() {
      return EventBinding.__super__.constructor.apply(this, arguments);
    }

    EventBinding.prototype.applyBinding = function() {
      var eventHandlers, handler;
      handler = this.filteredValue;
      eventHandlers = {};
      eventHandlers["on" + (Batman.helpers.camelize(this.attrArg))] = function(e) {
        e.preventDefault();
        return handler.apply(this, arguments);
      };
      this.safelySetProps(eventHandlers);
      return this.descriptor;
    };

    return EventBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.ForEachBinding = (function(_super) {
    __extends(ForEachBinding, _super);

    function ForEachBinding() {
      return ForEachBinding.__super__.constructor.apply(this, arguments);
    }

    ForEachBinding.prototype.applyBinding = function() {
      var baseContext, children, collection, collectionName, component, contextObserver, contextTarget, descriptor, displayName, forEachProp, innerContext, item, itemName, key, list, newProps, props, type, _getKey, _ref;
      _getKey = this._getEnumerateKey;
      itemName = this.attrArg;
      collectionName = this.keypath;
      collection = this.filteredValue;
      _ref = this.descriptor, type = _ref.type, children = _ref.children, props = _ref.props;
      forEachProp = {};
      forEachProp["data-foreach-" + itemName] = true;
      Batman.unmixin(props, forEachProp);
      displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0]);
      baseContext = this.descriptor.contextObserver.get('baseContext');
      delete baseContext[itemName];
      component = this.descriptor.contextObserver.component;
      if (collection != null ? collection.toArray : void 0) {
        collection = this.lookupKeypath("" + this.keypath + ".toArray");
      }
      list = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = collection.length; _i < _len; _i++) {
          item = collection[_i];
          innerContext = Batman.extend({}, baseContext);
          key = _getKey(item);
          innerContext[itemName] = item;
          contextTarget = new Batman.Object(innerContext);
          contextObserver = new Batman.ContextObserver({
            target: contextTarget,
            component: component
          });
          newProps = Batman.mixin({
            item: item,
            key: key
          }, props);
          descriptor = {
            type: type,
            children: cloneDescriptor(children),
            props: newProps,
            contextObserver: contextObserver
          };
          _results.push(bindBatmanDescriptor(descriptor));
        }
        return _results;
      })();
      return list;
    };

    ForEachBinding.prototype._getEnumerateKey = function(item) {
      if (item.hashKey != null) {
        return item.hashKey();
      } else {
        return JSON.stringify(item);
      }
    };

    return ForEachBinding;

  })(Batman.DOM.React.AbstractBinding);

  cloneDescriptor = function(descriptor, ctx) {
    var argType, item, key, newDescriptor, value, _i, _len, _results;
    argType = Batman.typeOf(descriptor);
    switch (argType) {
      case "Array":
        _results = [];
        for (_i = 0, _len = descriptor.length; _i < _len; _i++) {
          item = descriptor[_i];
          _results.push(cloneDescriptor(item));
        }
        return _results;
      case "Object":
        newDescriptor = {};
        for (key in descriptor) {
          value = descriptor[key];
          if (key === "contextObserver") {
            continue;
          } else {
            newDescriptor[key] = cloneDescriptor(value);
          }
        }
        return newDescriptor;
      default:
        return descriptor;
    }
  };

  Batman.DOM.React.HideIfBinding = (function(_super) {
    __extends(HideIfBinding, _super);

    function HideIfBinding() {
      return HideIfBinding.__super__.constructor.apply(this, arguments);
    }

    HideIfBinding.prototype.applyBinding = function() {
      var contentValue;
      contentValue = this.filteredValue;
      Batman.DOM.React.ShowIfBinding.prototype._showIf.call(this, !contentValue);
      return this.descriptor;
    };

    return HideIfBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.NotImplementedBinding = (function(_super) {
    __extends(NotImplementedBinding, _super);

    function NotImplementedBinding() {
      return NotImplementedBinding.__super__.constructor.apply(this, arguments);
    }

    NotImplementedBinding.prototype.applyBinding = function() {
      var attrArg;
      attrArg = this.attrArg ? "-" + this.attrArg : "";
      console.warn("This binding is not supported: <" + this.tagName + " data-" + this.bindingName + attrArg + "=" + this.keypath + " />");
      return this.descriptor;
    };

    return NotImplementedBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.RemoveClassBinding = (function(_super) {
    __extends(RemoveClassBinding, _super);

    function RemoveClassBinding() {
      return RemoveClassBinding.__super__.constructor.apply(this, arguments);
    }

    RemoveClassBinding.prototype.applyBinding = function() {
      var className;
      if (this.filteredValue) {
        className = this.descriptor.props.className || "";
        className = className.replace("" + this.attrArg, "");
        this.safelySetProps({
          className: className
        });
      }
      return this.descriptor;
    };

    return RemoveClassBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.RouteBinding = (function(_super) {
    __extends(RouteBinding, _super);

    function RouteBinding() {
      return RouteBinding.__super__.constructor.apply(this, arguments);
    }

    RouteBinding.prototype.applyBinding = function() {
      var href, onClick, path;
      path = this.filteredValue instanceof Batman.NamedRouteQuery ? this.filteredValue.get('path') : this.filteredValue;
      onClick = function(e) {
        e.stopPropagation();
        return Batman.redirect(path);
      };
      href = Batman.navigator.linkTo(path);
      this.safelySetProps({
        onClick: onClick,
        href: href
      });
      return this.descriptor;
    };

    return RouteBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.ShowIfBinding = (function(_super) {
    __extends(ShowIfBinding, _super);

    function ShowIfBinding() {
      return ShowIfBinding.__super__.constructor.apply(this, arguments);
    }

    ShowIfBinding.prototype.applyBinding = function() {
      var contentValue;
      contentValue = this.filteredValue;
      this._showIf(!!contentValue);
      return this.descriptor;
    };

    ShowIfBinding.prototype._showIf = function(trueOrFalse) {
      var style;
      style = Batman.mixin({}, this.descriptor.props.style || {});
      if (!trueOrFalse) {
        style.display = 'none !important';
      } else {
        delete style.display;
      }
      return this.safelySetProps({
        style: style
      });
    };

    return ShowIfBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.HTMLStore.prototype.onResolved = function(path, callback) {
    if (this.get(path) === void 0) {
      return this.observeOnce(path, callback);
    } else {
      return callback();
    }
  };

  this.BatmanReactDebug = true;

  this.reactDebug = function() {
    if (BatmanReactDebug) {
      return console.log.apply(console, arguments);
    }
  };

  reactComponentForRoutingKeyAndAction = function(routingKey, action, callback) {
    var HTMLPath, componentClass, componentName;
    componentName = Batman.helpers.camelize("" + routingKey + "_" + action + "_component");
    componentClass = Batman.currentApp[componentName];
    if (!componentClass) {
      HTMLPath = "" + routingKey + "/" + action;
      return Batman.View.store.onResolved(HTMLPath, (function(_this) {
        return function() {
          var displayName, html, reactCode, renderBatman, wrappedHTML;
          html = Batman.View.store.get(HTMLPath);
          wrappedHTML = "/** @jsx Batman.DOM */\n<div>" + html + "</div>";
          reactCode = JSXTransformer.transform(wrappedHTML).code;
          displayName = componentName;
          renderBatman = function() {
            return eval(reactCode);
          };
          componentClass = Batman.createComponent({
            displayName: displayName,
            renderBatman: renderBatman
          });
          Batman.currentApp[componentName] = componentClass;
          console.log("Defined React Component: " + componentName);
          return callback(componentClass);
        };
      })(this));
    } else {
      return callback(componentClass);
    }
  };

  Batman.Controller.prototype.renderReact = function(options) {
    var frame, _ref;
    if (options == null) {
      options = {};
    }
    if (frame = (_ref = this._actionFrames) != null ? _ref[this._actionFrames.length - 1] : void 0) {
      frame.startOperation();
    }
    if (options === false) {
      frame.finishOperation();
      return;
    }
    options.frame = frame;
    options.action = (frame != null ? frame.action : void 0) || this.get('action');
    options.componentName = Batman.helpers.camelize("" + (this.get('routingKey')) + "_" + options.action + "_component");
    options.componentClass = Batman.currentApp[options.componentName];
    return reactComponentForRoutingKeyAndAction(this.get('routingKey'), options.action, (function(_this) {
      return function(componentClass) {
        options.componentClass = componentClass;
        return _this.finishRenderReact(options);
      };
    })(this));
  };

  Batman.Controller.prototype.finishRenderReact = function(options) {
    var component, existingComponent, targetYield, view, yieldName, yieldNode, _ref;
    yieldName = options.into || "main";
    targetYield = Batman.DOM.Yield.withName(yieldName);
    yieldNode = targetYield.containerNode;
    component = options.componentClass({
      controller: this
    });
    if (existingComponent = targetYield.get('component')) {
      reactDebug("existing component", existingComponent);
      React.unmountComponentAtNode(yieldNode);
    }
    targetYield.set('component', component);
    if (view = targetYield.get('contentView')) {
      view.die();
      targetYield.unset('contentView');
    }
    targetYield.observeOnce('contentView', function(nv, ov) {
      if (nv != null) {
        return React.unmountComponentAtNode(this.containerNode);
      }
    });
    React.renderComponent(component, yieldNode);
    reactDebug("rendered " + this.routingKey + "/" + options.action, options.componentName);
    return (_ref = options.frame) != null ? _ref.finishOperation() : void 0;
  };

  Batman.ContextObserver = (function(_super) {
    __extends(ContextObserver, _super);

    function ContextObserver(_arg) {
      this.component = _arg.component, this.target = _arg.target;
      ContextObserver.__super__.constructor.call(this, {});
      this._alreadyObserving = {};
      this.forceUpdate = this._forceUpdate.bind(this);
      this.on("changed", this.forceUpdate);
    }

    ContextObserver.prototype._targets = function() {
      var _ref, _ref1;
      return this._targetArray || (this._targetArray = ((_ref = this.component) != null ? (_ref1 = _ref.props) != null ? _ref1.controller : void 0 : void 0) ? [this.target, this.component.props.controller, Batman.currentApp] : [this.target, Batman.currentApp]);
    };

    ContextObserver.prototype._forceUpdate = function() {
      if (this.component.isMounted()) {
        return this.component.forceUpdate();
      } else {
        return reactDebug("Wasn't mounted", this.component);
      }
    };

    ContextObserver.prototype._baseForKeypath = function(keypath) {
      var segment, segmentPath, target, _i, _j, _len, _len1, _ref, _ref1;
      segmentPath = "";
      _ref = keypath.split(".");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        segment = _ref[_i];
        segmentPath += segment;
        _ref1 = this._targets();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          target = _ref1[_j];
          if (typeof target.get(segmentPath) !== "undefined") {
            return target;
          }
        }
      }
      return void 0;
    };

    ContextObserver.prototype._observeKeypath = function(keypath) {
      var base, prop;
      if (this._alreadyObserving[keypath]) {
        return;
      }
      this._alreadyObserving[keypath] = true;
      base = this._baseForKeypath(keypath);
      prop = base.property(keypath);
      this.set(keypath, prop);
      prop.observe(this.forceUpdate);
      return prop.observe(function(nv, ov) {
        return reactDebug("forceUpdate because of " + prop.key + " " + (Batman.Filters.truncate(JSON.stringify(ov), 15)) + " -> " + (Batman.Filters.truncate(JSON.stringify(nv), 15)));
      });
    };

    ContextObserver.prototype.getContext = function(keypath) {
      var base, prop, terminal, value;
      base = this._baseForKeypath(keypath);
      if (!base) {
        console.warn("Nothing found for " + keypath);
        return;
      }
      prop = Batman.Property.forBaseAndKey(base, keypath);
      if (prop != null) {
        this._observeKeypath(keypath);
      }
      value = prop != null ? prop.getValue() : void 0;
      if (Batman.typeOf(value) === "Function") {
        terminal = new Batman.Keypath(base, keypath).terminalProperty();
        value = value.bind(terminal.base);
      }
      return value;
    };

    ContextObserver.prototype.setContext = function(keypath, value) {
      var base, _ref;
      base = this._baseForKeypath(keypath);
      if (base != null) {
        return (_ref = Batman.Property.forBaseAndKey(base, keypath)) != null ? _ref.setValue(value) : void 0;
      } else if (typeof value !== "undefined") {
        this.target.set(keypath, value);
        return this._observeKeypath(keypath);
      }
    };

    ContextObserver.accessor('context', function() {
      var ctx;
      ctx = {};
      this.forEach((function(_this) {
        return function(key, value) {
          return ctx[key] = _this.getContext(key);
        };
      })(this));
      return ctx;
    });

    ContextObserver.accessor('baseContext', function() {
      var ctx;
      ctx = {};
      this.forEach((function(_this) {
        return function(key, value) {
          var baseKey;
          baseKey = key.split(".")[0];
          if (!ctx[baseKey]) {
            return ctx[baseKey] = _this.getContext(baseKey);
          }
        };
      })(this));
      return ctx;
    });

    ContextObserver.prototype.die = function() {
      this.forEach((function(_this) {
        return function(keypathName, property) {
          if (property != null) {
            property.forget(_this.forceUpdate);
          }
          _this.forget(keypathName);
          return _this.unset(keypathName);
        };
      })(this));
      return this.off();
    };

    return ContextObserver;

  })(Batman.Hash);

  Batman.DOM.reactReaders = {
    bind: Batman.DOM.React.BindBinding,
    route: Batman.DOM.React.RouteBinding,
    showif: Batman.DOM.React.ShowIfBinding,
    hideif: Batman.DOM.React.HideIfBinding,
    target: Batman.DOM.React.BindBinding,
    source: Batman.DOM.React.BindBinding,
    defineview: Batman.DOM.React.NotImplementedBinding,
    insertif: Batman.DOM.React.NotImplementedBinding,
    removeif: Batman.DOM.React.NotImplementedBinding,
    deferif: Batman.DOM.React.NotImplementedBinding,
    renderif: Batman.DOM.React.NotImplementedBinding
  };

  Batman.DOM.reactAttrReaders = {
    foreach: Batman.DOM.React.ForEachBinding,
    event: Batman.DOM.React.EventBinding,
    bind: Batman.DOM.React.BindAttributeBinding,
    addclass: Batman.DOM.React.AddClassBinding,
    removeclass: Batman.DOM.React.RemoveClassBinding,
    context: Batman.DOM.React.ContextAttributeBinding,
    formfor: Batman.DOM.React.ContextAttributeBinding,
    source: Batman.DOM.React.BindAttributeBinding
  };

  _ref = React.DOM;
  _fn = function(tagName, tagFunc) {
    return Batman.DOM[tagName] = function() {
      var children, classes, descriptor, props;
      props = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (classes = props != null ? props["class"] : void 0) {
        props.className = classes;
        delete props["class"];
      }
      return descriptor = {
        type: tagName,
        props: props,
        children: children
      };
    };
  };
  for (tagName in _ref) {
    tagFunc = _ref[tagName];
    _fn(tagName, tagFunc);
  }

  Batman.ReactMixin = {
    getInitialState: function() {
      this._observeContext();
      return {};
    },
    willReceiveProps: function(nextProps) {
      return this._observeContext(nextProps);
    },
    componentWillUnmount: function() {
      return this._observer.die();
    },
    _observeContext: function(props) {
      var target;
      props || (props = this.props);
      target = props.contextTarget || new Batman.Object;
      reactDebug("observing contextTarget", target);
      if (this._observer) {
        this._observer.die();
      }
      return this._observer = new Batman.ContextObserver({
        target: target,
        component: this
      });
    },
    renderTree: function() {
      var components, tree;
      tree = this.renderBatman();
      tree.contextObserver = this._observer;
      components = bindBatmanDescriptor(tree);
      return components;
    }
  };

  bindBatmanDescriptor = function(descriptor) {
    var attrArg, bindingClass, bindingName, child, children, descriptorType, key, keyParts, newChildren, props, type, value, _ref1, _ref2;
    if (descriptor == null) {
      descriptor = {};
    }
    descriptorType = Batman.typeOf(descriptor);
    if (descriptorType === "String") {
      return descriptor;
    }
    _ref1 = descriptor.props;
    for (key in _ref1) {
      value = _ref1[key];
      if (!(key.substr(0, 5) === "data-")) {
        continue;
      }
      keyParts = key.split("-");
      bindingName = keyParts[1];
      if (keyParts.length > 2) {
        attrArg = keyParts.slice(2).join("-");
      } else {
        attrArg = void 0;
      }
      if (attrArg != null) {
        bindingClass = Batman.DOM.reactAttrReaders[bindingName];
      } else {
        bindingClass = Batman.DOM.reactReaders[bindingName];
      }
      if (!bindingClass) {
        console.warn("No binding found for " + key + "=" + value + " on " + descriptor.type);
      } else {
        descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding();
        if (bindingName === "foreach") {
          break;
        }
      }
    }
    if (descriptor != null ? descriptor.type : void 0) {
      type = descriptor.type, props = descriptor.props, children = descriptor.children;
      newChildren = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          child = children[_i];
          if (child.contextObserver == null) {
            child.contextObserver = descriptor.contextObserver;
          }
          _results.push(bindBatmanDescriptor(child));
        }
        return _results;
      })();
      return (_ref2 = React.DOM)[type].apply(_ref2, [props].concat(__slice.call(newChildren)));
    } else {
      return descriptor;
    }
  };

  Batman.createComponent = function(options) {
    options.mixins = options.mixins || [];
    options.mixins.push(Batman.ReactMixin);
    options.render = Batman.ReactMixin.renderTree;
    return React.createClass(options);
  };

  Batman.config.pathToApp = window.location.pathname;

  Batman.config.usePushState = false;

  this.App = (function(_super) {
    __extends(App, _super);

    function App() {
      return App.__super__.constructor.apply(this, arguments);
    }

    App.root('animals#index');

    App.resources('animals');

    App.syncsWithFirebase('batman-react');

    App.on('run', function() {
      App.Animal.load();
      return setTimeout((function(_this) {
        return function() {
          return _this._seedData();
        };
      })(this), 5000);
    });

    App._seedData = function() {
      var animal, n, totalAnimals, _i, _len, _ref1, _results;
      totalAnimals = App.Animal.get('all.length');
      if (totalAnimals === 0) {
        console.log("No data found, running seeds!");
        _ref1 = ["Spider", "Starfish", "Echidna"];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          n = _ref1[_i];
          animal = new App.Animal({
            name: n
          });
          _results.push(animal.save());
        }
        return _results;
      }
    };

    return App;

  })(Batman.App);

  $(function() {
    return App.run();
  });

  App.ApplicationController = (function(_super) {
    __extends(ApplicationController, _super);

    function ApplicationController() {
      return ApplicationController.__super__.constructor.apply(this, arguments);
    }

    ApplicationController.prototype.openDialog = function() {
      return $('.modal').modal('show');
    };

    ApplicationController.prototype.closeDialog = function() {
      var modalYield, _ref1;
      $('.modal').modal('hide');
      modalYield = Batman.DOM.Yield.get('yields.modal');
      if ((_ref1 = modalYield.get('contentView')) != null) {
        _ref1.die();
      }
      return modalYield.set('contentView', void 0);
    };

    ApplicationController.beforeAction(ApplicationController.prototype.closeDialog);

    ApplicationController.prototype.dialog = function(renderOptions) {
      var opts, view;
      if (renderOptions == null) {
        renderOptions = {};
      }
      opts = Batman.extend({
        into: "modal"
      }, renderOptions);
      return view = this.render(opts).on('ready', (function(_this) {
        return function() {
          return _this.openDialog();
        };
      })(this));
    };

    return ApplicationController;

  })(Batman.Controller);

  App.AnimalsController = (function(_super) {
    __extends(AnimalsController, _super);

    function AnimalsController() {
      return AnimalsController.__super__.constructor.apply(this, arguments);
    }

    AnimalsController.prototype.routingKey = 'animals';

    AnimalsController.prototype.index = function(params) {
      App.Animal.load((function(_this) {
        return function() {
          _this.set('newAnimal', new App.Animal);
          _this.set('animals', App.Animal.get('all.sortedBy.name'));
          return _this.renderReact();
        };
      })(this));
      return this.render(false);
    };

    AnimalsController.prototype.edit = function(animal) {
      this.set('currentAnimal', animal.transaction());
      this.renderReact({
        into: "modal"
      });
      return this.openDialog();
    };

    AnimalsController.prototype.show = function(params) {
      App.Animal.find(params.id, (function(_this) {
        return function(err, record) {
          if (err) {
            throw err;
          }
          _this.set('animal', record);
          return _this.renderReact();
        };
      })(this));
      return this.render(false);
    };

    AnimalsController.prototype.save = function(animal) {
      var wasNew;
      wasNew = animal.get('isNew');
      return animal.save((function(_this) {
        return function(err, record) {
          if (err) {
            return console.log(err);
          } else {
            if (wasNew) {
              _this.set('newAnimal', new App.Animal);
            }
            return Batman.redirect("/");
          }
        };
      })(this));
    };

    AnimalsController.prototype.destroy = function(animal) {
      return animal.destroy();
    };

    return AnimalsController;

  })(App.ApplicationController);

  App.Animal = (function(_super) {
    __extends(Animal, _super);

    function Animal() {
      return Animal.__super__.constructor.apply(this, arguments);
    }

    Animal.resourceName = 'animal';

    Animal.NAMES = ["Echidna", "Snail", "Shark", "Starfish", "Parakeet", "Clam", "Dolphin", "Gorilla", "Elephant", "Spider"];

    Animal.COLORS = ["red", "green", "blue", "brown", "black", "yellow", "gray", "orange"].sort();

    Animal.CLASSES = ["Mammal", "Fish", "Reptile", "Bird", "Amphibian", "Invertibrate"];

    Animal.persist(BatFire.Storage);

    Animal.encode('name', 'canFly', 'animalClass', 'color');

    Animal.validate('name', {
      inclusion: {
        "in": Animal.NAMES
      }
    });

    Animal.accessor('toString', function() {
      return "" + (this.get('name')) + " " + (this.get('animalClass'));
    });

    return Animal;

  })(Batman.Model);

}).call(this);
