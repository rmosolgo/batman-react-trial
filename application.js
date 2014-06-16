(function() {
  var CONTEXT_DEBUG, cloneDescriptor, contextDebug, tagFunc, type, _base, _fn, _ref,
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
      if (!this.descriptor.context) {
        debugger;
      }
      return this.descriptor.context.get(keypath);
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
      var _base1;
      (_base1 = this.descriptor).props || (_base1.props = {});
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
      var inputType, newProps, _ref;
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
                  return {
                    checked: false
                  };
                }
                break;
              case "radio":
                if ((this.filteredValue != null) && this.filteredValue === this.descriptor.props.value) {
                  return {
                    checked: true
                  };
                } else {
                  return {
                    checked: false
                  };
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
            value: (_ref = this.filteredValue) != null ? _ref : "",
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
      if (keypath == null) {
        keypath = this.keypath;
      }
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
          return _this.descriptor.context.set(keypath, value);
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
      var newContext;
      newContext = this.descriptor.context.injectContextAttribute(this.attrArg, this.filteredValue);
      this.descriptor.context = newContext;
      return this.descriptor;
    };

    return ContextAttributeBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.ContextBinding = (function(_super) {
    __extends(ContextBinding, _super);

    function ContextBinding() {
      return ContextBinding.__super__.constructor.apply(this, arguments);
    }

    ContextBinding.prototype.applyBinding = function() {
      var newContext;
      newContext = this.descriptor.context.injectContextTarget(this.filteredValue);
      this.descriptor.context = newContext;
      return this.descriptor;
    };

    return ContextBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.DebugBinding = (function(_super) {
    __extends(DebugBinding, _super);

    function DebugBinding() {
      return DebugBinding.__super__.constructor.apply(this, arguments);
    }

    DebugBinding.prototype.applyBinding = function() {
      debugger;
      return this.descriptor;
    };

    return DebugBinding;

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
      eventHandlers["on" + (Batman.helpers.camelize(this.attrArg))] = (function(_this) {
        return function(e) {
          e.preventDefault();
          return handler();
        };
      })(this);
      this.safelySetProps(eventHandlers);
      return this.descriptor;
    };

    EventBinding.prototype.getUnfilteredValue = function() {
      var base, terminal;
      base = this.descriptor.context.baseForKeypath(this.key);
      terminal = new Batman.Keypath(base, this.key).terminalProperty();
      return this.unfilteredValue = terminal.getValue().bind(terminal.base);
    };

    return EventBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.ForEachBinding = (function(_super) {
    __extends(ForEachBinding, _super);

    function ForEachBinding() {
      return ForEachBinding.__super__.constructor.apply(this, arguments);
    }

    ForEachBinding.prototype.applyBinding = function() {
      var children, collection, collectionName, context, displayName, itemName, newDescriptors, props, type, _getKey, _ref, _removeBinding;
      _getKey = this._getEnumerateKey;
      _removeBinding = this._removeForEachBinding.bind(this);
      itemName = this.attrArg;
      collectionName = this.keypath;
      collection = this.filteredValue;
      if (!collection) {
        return [];
      }
      _ref = this.descriptor, type = _ref.type, children = _ref.children, props = _ref.props, context = _ref.context;
      displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0]);
      if (collection != null ? collection.toArray : void 0) {
        collection = collection.toArray();
      }
      newDescriptors = [];
      Batman.forEach(collection, function(item) {
        var descriptor, injectedContext, key, newProps;
        key = _getKey(item);
        injectedContext = context.injectContextAttribute(itemName, item);
        newProps = Batman.mixin({}, props, {
          key: key,
          item: item
        });
        _removeBinding(newProps);
        descriptor = new Batman.DOM.React.Descriptor({
          type: type,
          children: cloneDescriptor(children, injectedContext),
          props: newProps,
          context: injectedContext
        });
        console.log("descriptor for " + displayName + " " + ((item != null ? typeof item.get === "function" ? item.get('name') : void 0 : void 0) || collectionName));
        return newDescriptors.push(descriptor);
      });
      return newDescriptors;
    };

    ForEachBinding.prototype._getEnumerateKey = function(item) {
      if (item.hashKey != null) {
        return item.hashKey();
      } else {
        return JSON.stringify(item);
      }
    };

    ForEachBinding.prototype._removeForEachBinding = function(props) {
      var forEachProp;
      forEachProp = {};
      forEachProp["data-foreach-" + this.attrArg] = true;
      return Batman.unmixin(props, forEachProp);
    };

    return ForEachBinding;

  })(Batman.DOM.React.AbstractBinding);

  cloneDescriptor = function(descriptor, context) {
    var item, newDescriptor, _i, _len, _results;
    if (context == null) {
      debugger;
    }
    if (descriptor instanceof Array) {
      _results = [];
      for (_i = 0, _len = descriptor.length; _i < _len; _i++) {
        item = descriptor[_i];
        _results.push(cloneDescriptor(item, context));
      }
      return _results;
    } else if (descriptor instanceof Batman.DOM.React.Descriptor) {
      return newDescriptor = new Batman.DOM.React.Descriptor({
        type: descriptor.type,
        props: Batman.mixin({}, descriptor.props),
        children: cloneDescriptor(descriptor.children, context),
        context: context
      });
    } else {
      return descriptor;
    }
  };

  Batman.DOM.React.HideIfBinding = (function(_super) {
    __extends(HideIfBinding, _super);

    function HideIfBinding() {
      return HideIfBinding.__super__.constructor.apply(this, arguments);
    }

    HideIfBinding.prototype.applyBinding = function() {
      Batman.DOM.React.ShowIfBinding.prototype._showIf.call(this, !this.filteredValue);
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

  Batman.DOM.React.PartialBinding = (function(_super) {
    __extends(PartialBinding, _super);

    function PartialBinding() {
      return PartialBinding.__super__.constructor.apply(this, arguments);
    }

    PartialBinding.prototype.applyBinding = function() {
      var async, context, props, type, _ref;
      _ref = this.descriptor, type = _ref.type, context = _ref.context, props = _ref.props;
      async = false;
      Batman.reactCodeForHTMLPath(this.filteredValue, (function(_this) {
        return function(reactFunc) {
          var childProps, children, partialDescriptor;
          childProps = {
            key: _this.filteredValue
          };
          children = [reactFunc(childProps)];
          partialDescriptor = {
            type: type,
            props: props,
            children: children,
            context: context
          };
          _this.descriptor = partialDescriptor;
          if (async) {
            return context.component.forceUpdate();
          }
        };
      })(this));
      async = true;
      return this.descriptor;
    };

    return PartialBinding;

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
      this._showIf(this.filteredValue);
      return this.descriptor;
    };

    ShowIfBinding.prototype._showIf = function(shouldShow) {
      var style;
      style = this.descriptor.props.style || {};
      if (shouldShow) {
        console.log("Showing " + this.descriptor.type + " " + this.descriptor.children + " for " + this.keypath);
        delete style.display;
      } else {
        console.log("Hiding " + this.descriptor.type + " " + this.descriptor.children + " for " + this.keypath);
        style.display = 'none !important';
      }
      return this.descriptor.props.style = style;
    };

    return ShowIfBinding;

  })(Batman.DOM.React.AbstractBinding);

  Batman.DOM.React.StyleAttributeBinding = (function(_super) {
    __extends(StyleAttributeBinding, _super);

    function StyleAttributeBinding() {
      return StyleAttributeBinding.__super__.constructor.apply(this, arguments);
    }

    StyleAttributeBinding.prototype.applyBinding = function() {
      var styleProp, _base1;
      styleProp = (_base1 = this.descriptor.props).style || (_base1.style = {});
      styleProp[this.attrArg] = this.filteredValue;
      this.descriptor.props.style = styleProp;
      return this.descriptor;
    };

    StyleAttributeBinding.prototype.styleStringToObject = function(str) {
      var declaration, declarations, property, propertyName, styles, value, values, _i, _len, _ref;
      styles = {};
      declarations = str.split(";");
      for (_i = 0, _len = declarations.length; _i < _len; _i++) {
        declaration = declarations[_i];
        if (!(declaration)) {
          continue;
        }
        _ref = declaration.split(":"), property = _ref[0], values = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
        value = values.join(":");
        propertyName = Batman.helpers.camelize(property, true);
        styles[propertyName] = value;
      }
      return styles;
    };

    return StyleAttributeBinding;

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

  Batman.reactComponentForRoutingKeyAndAction = function(routingKey, action, callback) {
    var HTMLPath, componentClass, componentName;
    componentName = Batman.helpers.camelize("" + routingKey + "_" + action + "_component");
    componentClass = Batman.currentApp[componentName];
    if (!componentClass) {
      HTMLPath = "" + routingKey + "/" + action;
      return Batman.reactComponentForHTMLPath(HTMLPath, componentName, function(componentClass) {
        Batman.currentApp[componentName] = componentClass;
        console.log("Defined React Component: " + componentName);
        return callback(componentClass);
      });
    } else {
      return callback(componentClass);
    }
  };

  Batman.reactComponentForHTMLPath = function(HTMLPath, displayName, callback) {
    if (callback == null) {
      callback = displayName;
      displayName = HTMLPath;
    }
    return Batman.reactCodeForHTMLPath(HTMLPath, function(reactFunction) {
      var componentClass, renderBatman;
      renderBatman = reactFunction;
      componentClass = Batman.createComponent({
        renderBatman: renderBatman,
        displayName: displayName
      });
      return callback(componentClass);
    });
  };

  Batman.reactCodeForHTMLPath = function(HTMLPath, callback) {
    return Batman.View.store.onResolved(HTMLPath, (function(_this) {
      return function() {
        var html, reactCode, reactFunction, wrappedHTML;
        html = Batman.View.store.get(HTMLPath);
        wrappedHTML = "/** @jsx Batman.DOM */\n<div>" + html + "</div>";
        reactCode = JSXTransformer.transform(wrappedHTML).code;
        reactFunction = function() {
          return eval(reactCode);
        };
        return callback(reactFunction);
      };
    })(this));
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
    return Batman.reactComponentForRoutingKeyAndAction(this.get('routingKey'), options.action, (function(_this) {
      return function(componentClass) {
        options.componentClass = componentClass;
        return _this.finishRenderReact(options);
      };
    })(this));
  };

  Batman.Controller.prototype.finishRenderReact = function(options) {
    var component, existingComponent, targetYield, view, yieldName, yieldNode, _ref, _ref1;
    yieldName = options.into || "main";
    targetYield = Batman.DOM.Yield.withName(yieldName);
    yieldNode = targetYield.containerNode;
    component = options.componentClass({
      controller: this
    });
    if (existingComponent = targetYield.get('component')) {
      reactDebug("existing component", (_ref = existingComponent.constructor) != null ? _ref.displayName : void 0);
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
    return (_ref1 = options.frame) != null ? _ref1.finishOperation() : void 0;
  };

  CONTEXT_DEBUG = false;

  contextDebug = function() {
    if (CONTEXT_DEBUG) {
      return console.log.apply(console, arguments);
    }
  };

  Batman.DOM.React.ContextMixin = {
    initialize: function() {
      this.injectContextAttribute = function(key, value) {
        this._prepareProxies();
        return this._proxies.forKey(key).getOrSet(value, (function(_this) {
          return function() {
            var proxy;
            proxy = new Batman.DOM.React.ContextAttributeProxy(_this);
            proxy.accessor(key, function() {
              return value;
            });
            return proxy;
          };
        })(this));
      };
      this.injectContextTarget = function(object) {
        this._prepareProxies();
        return this._proxies.getOrSet(object, (function(_this) {
          return function() {
            var proxy;
            proxy = new Batman.DOM.React.ContextTargetProxy(_this);
            proxy._context = object;
            return proxy;
          };
        })(this));
      };
      return this._prepareProxies = function() {
        return this._proxies || (this._proxies = new Batman.DOM.React.ContextProxyHash);
      };
    }
  };

  Batman.DOM.React.Context = (function(_super) {
    __extends(Context, _super);

    function Context(_arg) {
      var _ref, _ref1;
      this.component = _arg.component, this.controller = _arg.controller;
      Context.__super__.constructor.call(this, {});
      this.componentName = (_ref = this.component) != null ? (_ref1 = _ref.constructor) != null ? _ref1.displayName : void 0 : void 0;
      this._storage = new Batman.Hash;
      this._targets = [this.controller, Batman.currentApp];
      contextDebug("CONTEXT created " + (this.get('_batmanID')));
    }

    Context.mixin(Batman.DOM.React.ContextMixin);

    Context.accessor({
      get: function(key) {
        var base, value;
        base = this.baseForKeypath(key);
        return value = base != null ? base.get(key) : void 0;
      },
      set: function(key, value) {
        var base;
        base = this.baseForKeypath(key);
        return base != null ? base.set(key, value) : void 0;
      }
    });

    Context.prototype.baseForKeypath = function(keypath) {
      var base, firstPart, parts;
      contextDebug("CONTEXT lookup " + (this.get("_batmanID")) + " " + keypath + " " + this.constructor.name);
      parts = keypath.split(".");
      firstPart = parts.shift();
      return base = this._findBase(firstPart);
    };

    Context.prototype._findBase = function(firstPart) {
      var target, _i, _len, _ref;
      _ref = this._targets;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        target = _ref[_i];
        if (typeof target.get(firstPart) !== "undefined") {
          return target;
        }
      }
      return this._storage;
    };

    Context.prototype.die = function() {
      var event, _, _ref, _ref1;
      if (this.isDead) {
        console.warn("Trying to kill and already-dead " + this.constructor.name);
        return;
      }
      contextDebug("CONTEXT dying  " + (this.get('_batmanID')));
      if ((_ref = this._batman.properties) != null) {
        _ref.forEach(function(key, property) {
          return property.die();
        });
      }
      if (this._batman.events) {
        _ref1 = this._batman.events;
        for (_ in _ref1) {
          event = _ref1[_];
          event.clearHandlers();
        }
      }
      this._storage = null;
      this._proxies = null;
      this.controller = null;
      this.component = null;
      this._targets = null;
      this._findBase = function() {};
      this.isDead = true;
      return this.fire('die');
    };

    return Context;

  })(Batman.Object);

  Batman.DOM.React.ContextProxy = (function(_super) {
    __extends(ContextProxy, _super);

    function ContextProxy() {
      ContextProxy.__super__.constructor.apply(this, arguments);
      contextDebug("CONTEXT PROXY created " + (this.get("_batmanID")) + " " + this.constructor.name);
      this.target.on('die', this.die.bind(this));
      this.componentName = this.target.componentName;
    }

    ContextProxy.mixin(Batman.DOM.React.ContextMixin);

    ContextProxy.prototype.baseForKeypath = function(keypath) {
      contextDebug("CONTEXT PROXY lookup " + (this.get("_batmanID")) + " " + keypath + " " + this.constructor.name);
      return this.target.baseForKeypath(keypath);
    };

    ContextProxy.prototype.die = function() {
      var event, _, _ref, _ref1;
      if ((_ref = this._batman.properties) != null) {
        _ref.forEach(function(key, property) {
          return property.die();
        });
      }
      if (this._batman.events) {
        _ref1 = this._batman.events;
        for (_ in _ref1) {
          event = _ref1[_];
          event.clearHandlers();
        }
      }
      contextDebug("CONTEXT PROXY dying " + (this.get("_batmanID")) + " " + this.constructor.name);
      this.isDead = true;
      return this.target.die();
    };

    return ContextProxy;

  })(Batman.Proxy);

  Batman.DOM.React.ContextAttributeProxy = (function(_super) {
    __extends(ContextAttributeProxy, _super);

    function ContextAttributeProxy() {
      return ContextAttributeProxy.__super__.constructor.apply(this, arguments);
    }

    return ContextAttributeProxy;

  })(Batman.DOM.React.ContextProxy);

  Batman.DOM.React.ContextTargetProxy = (function(_super) {
    __extends(ContextTargetProxy, _super);

    function ContextTargetProxy() {
      return ContextTargetProxy.__super__.constructor.apply(this, arguments);
    }

    ContextTargetProxy.wrapAccessor(function(core) {
      return {
        get: function(key) {
          var firstPart, obj, parts;
          parts = key.split(".");
          firstPart = parts.shift();
          if (obj = Batman.get(this._context, firstPart)) {
            return Batman.get(this._context, key);
          } else {
            return core.get.call(this.target, key);
          }
        }
      };
    });

    ContextTargetProxy.prototype.die = function() {
      ContextTargetProxy.__super__.die.apply(this, arguments);
      return this._targets = null;
    };

    return ContextTargetProxy;

  })(Batman.DOM.React.ContextProxy);

  Batman.DOM.React.ContextProxyHash = (function(_super) {
    __extends(ContextProxyHash, _super);

    function ContextProxyHash() {
      return ContextProxyHash.__super__.constructor.apply(this, arguments);
    }

    ContextProxyHash.prototype.forKey = function(key) {
      return this.getOrSet(key, (function(_this) {
        return function() {
          return new _this.constructor;
        };
      })(this));
    };

    return ContextProxyHash;

  })(Batman.Hash);

  Batman.DOM.React.Descriptor = (function(_super) {
    __extends(Descriptor, _super);

    Descriptor.COUNTER = 0;

    Descriptor.UPDATING = false;

    function Descriptor(_arg) {
      this.type = _arg.type, this.props = _arg.props, this.children = _arg.children, this.context = _arg.context;
    }

    Descriptor.accessor('toReact', function() {
      var plainObj;
      plainObj = this.get('toObject');
      return this._invokeOnReact(plainObj);
    });

    Descriptor.prototype._invokeOnReact = function(item) {
      var child, children, member, props, type, _i, _len, _ref, _ref1, _results;
      if (item instanceof Array) {
        _results = [];
        for (_i = 0, _len = item.length; _i < _len; _i++) {
          member = item[_i];
          _results.push(this._invokeOnReact(member));
        }
        return _results;
      } else if (((_ref = typeof item) === "string" || _ref === "number" || _ref === "boolean" || _ref === "undefined") || (item == null)) {
        return item;
      } else {
        type = item.type, props = item.props, children = item.children;
        children = (function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = children.length; _j < _len1; _j++) {
            child = children[_j];
            _results1.push(this._invokeOnReact(child));
          }
          return _results1;
        }).call(this);
        return (_ref1 = React.DOM)[type].apply(_ref1, [props].concat(__slice.call(children)));
      }
    };

    Descriptor.accessor('toObject', function() {
      var plainObj;
      return plainObj = this.performReactTransforms({
        type: this.type,
        props: this.props,
        children: this.children,
        context: this.context
      });
    });

    Descriptor.prototype.performReactTransforms = function(descriptor) {
      var attrArg, bindingClass, bindingName, context, key, keyParts, value, _ref;
      context = descriptor.context;
      _ref = descriptor.props;
      for (key in _ref) {
        value = _ref[key];
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
          console.warn("No binding found for " + key + "=" + value + " on " + this.type);
        } else if (bindingName === "foreach") {
          descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding();
          break;
        } else {
          descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding();
        }
      }
      if ((descriptor.context != null) && descriptor.context !== context) {
        context = descriptor.context;
      }
      return this._handleTransformedDescriptor(descriptor, context);
    };

    Descriptor.prototype._handleTransformedDescriptor = function(descriptor, context) {
      var child, _i, _len, _ref, _results;
      if (descriptor instanceof Array) {
        _results = [];
        for (_i = 0, _len = descriptor.length; _i < _len; _i++) {
          child = descriptor[_i];
          _results.push(this._handleTransformedDescriptor(child, context));
        }
        return _results;
      } else if (descriptor instanceof Batman.DOM.React.Descriptor) {
        descriptor.context || (descriptor.context = context);
        return descriptor.get('toObject');
      } else if (((_ref = typeof descriptor) === "string" || _ref === "number" || _ref === "boolean" || _ref === "undefined") || (descriptor == null)) {
        return descriptor;
      } else {
        descriptor.children = (function() {
          var _j, _len1, _ref1, _results1;
          _ref1 = descriptor.children;
          _results1 = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            child = _ref1[_j];
            child.context = context;
            _results1.push(this._handleTransformedDescriptor(child, context));
          }
          return _results1;
        }).call(this);
        return descriptor;
      }
    };

    return Descriptor;

  })(Batman.Object);

  Batman.DOM.reactReaders = {
    bind: Batman.DOM.React.BindBinding,
    route: Batman.DOM.React.RouteBinding,
    showif: Batman.DOM.React.ShowIfBinding,
    hideif: Batman.DOM.React.HideIfBinding,
    partial: Batman.DOM.React.PartialBinding,
    context: Batman.DOM.React.ContextBinding,
    debug: Batman.DOM.React.DebugBinding,
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
    style: Batman.DOM.React.StyleAttributeBinding,
    formfor: Batman.DOM.React.ContextAttributeBinding,
    source: Batman.DOM.React.BindAttributeBinding
  };

  _ref = React.DOM;
  _fn = function(type, tagFunc) {
    return Batman.DOM[type] = function() {
      var children, classes, descriptor, props, styles;
      props = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (classes = props != null ? props["class"] : void 0) {
        props.className = classes;
        delete props["class"];
      }
      if (styles = props != null ? props.style : void 0) {
        props.style = Batman.DOM.React.StyleAttributeBinding.prototype.styleStringToObject(styles);
      }
      return descriptor = new Batman.DOM.React.Descriptor({
        type: type,
        props: props,
        children: children
      });
    };
  };
  for (type in _ref) {
    tagFunc = _ref[type];
    _fn(type, tagFunc);
  }

  Batman.ReactMixin = {
    componentWillReceiveProps: function() {
      return this._createTopLevelContext();
    },
    componentWillMount: function() {
      return this._createTopLevelContext();
    },
    componentWillUnmount: function() {
      if (this._context.component === this) {
        this._context.die();
        this._context = null;
        return reactDebug("componentWillUnmount, killing context");
      }
    },
    _createTopLevelContext: function() {
      var _ref1;
      if ((this._context == null) || ((_ref1 = this._context) != null ? _ref1.isDead : void 0)) {
        this._context = new Batman.DOM.React.Context({
          controller: this.props.controller,
          component: this
        });
        return console.log("CONTEXT assigned " + (this._context.get("_batmanID")));
      }
    },
    _setupTreeDescriptor: function() {
      this.treeDescriptor = this.renderBatman();
      this.treeDescriptor.context = this._context;
      console.log("observing " + (this.treeDescriptor.get('_batmanID')));
      return this.treeDescriptor.property('toReact').observe((function(_this) {
        return function() {
          return _this.forceUpdate();
        };
      })(this));
    },
    renderTree: function() {
      var react;
      this._createTopLevelContext();
      if (!this.treeDescriptor) {
        this._setupTreeDescriptor();
      } else {
        this.treeDescriptor.context = this._context;
      }
      react = this.treeDescriptor.get('toReact');
      return react;
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

    Animal.NAMES = ["Echidna", "Snail", "Shark", "Starfish", "Parakeet", "Clam", "Dolphin", "Gorilla", "Bat", "Spider", "Tyrannosaurus Rex"];

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

    Animal.accessor('fontSize', function() {
      return this.get('name.length') * 2;
    });

    return Animal;

  })(Batman.Model);

}).call(this);

Batman.View.store.set('/animals/detail', '<p>\n  These details about&nbsp;\n  <span data-bind=\'animal.name\'></span>\n  &nbsp;were loaded from a different HTML file:\n  <ul data-context=\'animal\'>\n    <li data-bind=\'canFly | default \"Not selected\" | prepend \"Can Fly: \"\'></li>\n    <li data-bind=\'color | default \"Not selected\" | prepend \"Color: \"\'></li>\n    <li data-bind=\'animalClass | default \"Not selected\"\'></li>\n  </ul>\n</p>');
Batman.View.store.set('/animals/edit', '<div>\n  <div class=\"modal-header\">\n    <h2 class=\"modal-title\">\n      <span>Edit </span>\n      <span data-bind=\"currentAnimal.name\"></span>\n    </h2>\n  </div>\n  <div class=\"modal-body\">\n    <form data-event-submit=\"save | withArguments currentAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'currentAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>Name</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\"currentAnimal.name\"/>\n      </div>\n      <div class=\"checkbox\">\n        <label>\n          Can Fly?\n          <input type=\"checkbox\" class=\'checkbox\' data-bind=\'currentAnimal.canFly\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label data-foreach-animalclass=\'Animal.CLASSES\' class=\'radio-inline\'>\n          <span data-bind=\'animalclass\'></span>\n          <input type=\'radio\' data-bind-value=\'animalclass\' data-bind=\'currentAnimal.animalClass\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label>Color:</label>\n        <select class=\'form-control\' data-bind=\"currentAnimal.color\">\n          <option value=\'\'>Pick a color</option>\n          <option data-foreach-color=\'Animal.COLORS\' data-bind-value=\'color\' data-bind=\'color\'></option>\n        </select>\n      </div>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-success\" />\n    </form>\n  </div>\n  <div class=\"modal-footer\">\n    <button data-event-click=\'closeDialog\' class=\"btn\">Close</button>\n  </div>\n</div>');
Batman.View.store.set('/animals/index', '<h1>\n  All Animals\n  <small> (<span data-bind=\'\"Animal\" | pluralize animals.length\'></span>)</small>\n</h1>\n<ul class=\"list-unstyled\">\n  <li data-foreach-animal=\'animals\'>\n    <div class=\"row\">\n      <div class=\"col-xs-4\" data-context-canfly=\'animal.canFly\'>\n        <a data-route=\"routes.animals[animal]\">\n          <p class=\"lead text-warning\"\n            data-removeclass-text-warning=\'canfly\'\n            data-addclass-text-success=\'canfly\'\n            data-addclass-text-danger=\'canfly | not\'\n            >\n            <span data-bind=\'animal.name\'></span>\n            <span class=\"text-muted\" data-showif=\'animal.canFly\'> (can fly)</span>\n            <span class=\"text-muted\" data-hideif=\'animal.canFly\'> (can\'t fly)</span>\n            &mdash;\n            <span class=\"text-muted\" data-showif=\'canfly\'> (can fly ctx)</span>\n            <span class=\"text-muted\" data-hideif=\'canfly\'> (can\'t fly ctx)</span>\n          </p>\n        </a>\n      </div>\n      <div class=\"col-xs-4\">\n        <small data-showif=\'animal.color\' data-bind=\"animal.color | upcase | append \' \'\"></small>\n        <small data-bind=\"animal.animalClass | upcase\"></small>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'executeAction | withArguments \"edit\", animal\' class=\"btn\">Edit in Dialog</button>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'destroy | withArguments animal\' class=\"btn btn-danger\">Destroy</button>\n      </div>\n    </div>\n  </li>\n</ul>\n<div data-partial=\'\"animals/new_form\"\'></div>\n');
Batman.View.store.set('/animals/new_form', '<p class=\"row\">\n  <div class=\"well\">\n    <form data-formfor-animal=\'newAnimal\' data-event-submit=\"save | withArguments newAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'newAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>New Animal:</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\'newAnimal.name\'/>\n      </div>\n      <p>\n        Make a new animal:\n        <span data-bind=\"Animal.NAMES | join \', \' | prepend \' \' \"></span>\n      </p>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-primary\"/>\n    </form>\n  </div>\n</p>');
Batman.View.store.set('/animals/show', '<div>\n  <h1 data-bind=\'animal.name\'></h1>\n  <p data-showif=\'animal.animalClass | eq \"Mammal\"\'>\n    Mammalian\n  </p>\n  <p data-showif=\'animal.animalClass | eq \"Reptile\"\'>\n    Reptilian\n  </p>\n  <p>I put this page here to test data-route bindings.</p>\n  <p style=\'font-weight: 800;\' data-style-font-size=\'animal.fontSize\' data-style-color=\'animal.color\'>\n    This font-size is bound to <code>animal.name</code>.\n  </p>\n  <div data-partial=\'\"animals/detail\"\'></div>\n  <p>\n    <a data-route=\'routes.animals\' class=\'btn btn-primary\'>Go back</a>\n  </p>\n</div>');