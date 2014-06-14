(function() {
  var bindBatmanDescriptor, cloneDescriptor, tagFunc, tagName, _base, _fn, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
      var injectedValue, keypathWasFound, _ref, _ref1, _ref2;
      _ref = this._lookupInjectedKeypath(keypath), keypathWasFound = _ref[0], injectedValue = _ref[1];
      if (keypathWasFound) {
        return injectedValue;
      } else {
        return (_ref1 = this.descriptor) != null ? (_ref2 = _ref1.contextObserver) != null ? _ref2.getContext(keypath) : void 0 : void 0;
      }
    };

    AbstractBinding.prototype._lookupInjectedKeypath = function(keypath) {
      var firstPart, hit, obj, parts, path, prop, _i, _len, _ref, _ref1;
      if (this.descriptor.props.injectedContext == null) {
        return [false, void 0];
      }
      parts = keypath.split(".");
      firstPart = parts.shift();
      if (obj = this.descriptor.props.injectedContext[firstPart]) {
        if (parts.length) {
          path = parts.join(".");
          hit = obj.get(path);
          prop = obj.property(path);
          if (this.descriptor.contextObserver.observeProperty(prop)) {
            console.log("observing " + path + " on " + firstPart);
          }
        } else {
          hit = obj;
        }
        return [true, hit];
      } else if ((_ref = this.descriptor.props.injectedContext._injectedObjects) != null ? _ref.length : void 0) {
        _ref1 = this.descriptor.props.injectedContext._injectedObjects;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          obj = _ref1[_i];
          if (obj.get(firstPart) != null) {
            hit = obj.get(keypath);
            prop = obj.property(keypath);
            this.descriptor.contextObserver.observeProperty(prop);
            return [true, hit];
          }
        }
        return [false, void 0];
      } else {
        return [false, void 0];
      }
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
          return _this.descriptor.contextObserver.setContext(keypath, value);
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
      var _base1;
      (_base1 = this.descriptor.props).injectedContext || (_base1.injectedContext = {});
      this.descriptor.props.injectedContext[this.attrArg] = this.filteredValue;
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
      var _base1, _base2;
      (_base1 = this.descriptor.props).injectedContext || (_base1.injectedContext = {});
      (_base2 = this.descriptor.props.injectedContext)._injectedObjects || (_base2._injectedObjects = []);
      this.descriptor.props.injectedContext._injectedObjects.push(this.filteredValue);
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
          return handler.apply(_this, arguments);
        };
      })(this);
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
      var children, collection, collectionName, component, contextObserver, descriptor, displayName, forEachProp, injectedContext, item, itemName, key, list, newProps, props, type, _getKey, _ref;
      _getKey = this._getEnumerateKey;
      itemName = this.attrArg;
      collectionName = this.keypath;
      collection = this.filteredValue;
      _ref = this.descriptor, type = _ref.type, children = _ref.children, props = _ref.props, contextObserver = _ref.contextObserver;
      forEachProp = {};
      forEachProp["data-foreach-" + itemName] = true;
      Batman.unmixin(props, forEachProp);
      displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0]);
      component = contextObserver.component;
      if (collection != null ? collection.toArray : void 0) {
        collection = this.lookupKeypath("" + this.keypath + ".toArray");
      }
      list = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = collection.length; _i < _len; _i++) {
          item = collection[_i];
          key = _getKey(item);
          injectedContext = Batman.mixin({}, props.injectedContext);
          injectedContext[itemName] = item;
          newProps = Batman.mixin({}, props, {
            key: key,
            injectedContext: injectedContext
          });
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

  Batman.DOM.React.PartialBinding = (function(_super) {
    __extends(PartialBinding, _super);

    function PartialBinding() {
      return PartialBinding.__super__.constructor.apply(this, arguments);
    }

    PartialBinding.prototype.applyBinding = function() {
      var async, contextObserver, type, _ref;
      _ref = this.descriptor, type = _ref.type, contextObserver = _ref.contextObserver;
      async = false;
      Batman.reactComponentForHTMLPath(this.filteredValue, (function(_this) {
        return function(componentClass) {
          var childProps, children, injectedContext, partialDescriptor;
          injectedContext = _this.descriptor.props.injectedContext;
          childProps = {
            injectedContext: injectedContext,
            key: _this.filteredValue
          };
          children = [componentClass(childProps).renderBatman()];
          partialDescriptor = {
            type: type,
            props: {},
            children: children,
            contextObserver: contextObserver
          };
          _this.descriptor = partialDescriptor;
          if (async) {
            reactDebug("data-partial async " + _this.filteredValue);
            return contextObserver.forceUpdate();
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
      return Batman.reactComponentForHTMLPath(HTMLPath, function(componentClass) {
        componentClass.displayName = componentName;
        Batman.currentApp[componentName] = componentClass;
        console.log("Defined React Component: " + componentName);
        return callback(componentClass);
      });
    } else {
      return callback(componentClass);
    }
  };

  Batman.reactComponentForHTMLPath = function(HTMLPath, callback) {
    return Batman.View.store.onResolved(HTMLPath, (function(_this) {
      return function() {
        var componentClass, html, reactCode, renderBatman, wrappedHTML;
        html = Batman.View.store.get(HTMLPath);
        wrappedHTML = "/** @jsx Batman.DOM */\n<div>" + html + "</div>";
        reactCode = JSXTransformer.transform(wrappedHTML).code;
        renderBatman = function() {
          return eval(reactCode);
        };
        componentClass = Batman.createComponent({
          renderBatman: renderBatman
        });
        return callback(componentClass);
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

    ContextObserver.COUNT = 0;

    function ContextObserver(_arg) {
      this.component = _arg.component, this.target = _arg.target;
      ContextObserver.__super__.constructor.call(this, {});
      this.constructor.COUNT += 1;
      this._logCount();
      this._properties = [];
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

    ContextObserver.prototype.observeProperty = function(prop) {
      this._logProperties || (this._logProperties = Batman.setImmediate((function(_this) {
        return function() {
          if (_this.DEAD) {
            console.log("Observer was killed");
          } else {
            console.log("Now tracking " + _this._properties.length + " properties");
          }
          return _this._logProperties = false;
        };
      })(this)));
      if (__indexOf.call(this._properties, prop) >= 0) {
        return false;
      }
      this._properties.push(prop);
      prop.observe(this.forceUpdate);
      prop.observe(function(nv, ov) {
        return reactDebug("forceUpdate because of " + prop.key + " " + (Batman.Filters.truncate(JSON.stringify(ov), 15)) + " -> " + (Batman.Filters.truncate(JSON.stringify(nv), 15)));
      });
      return true;
    };

    ContextObserver.prototype.getContext = function(keypath) {
      var base, prop, terminal, value;
      base = this._baseForKeypath(keypath);
      if (!base) {
        return;
      }
      prop = Batman.Property.forBaseAndKey(base, keypath);
      if (prop != null) {
        this.observeProperty(prop);
      }
      value = prop != null ? prop.getValue() : void 0;
      if (Batman.typeOf(value) === "Function") {
        terminal = new Batman.Keypath(base, keypath).terminalProperty();
        value = value.bind(terminal.base);
      }
      return value;
    };

    ContextObserver.prototype.setContext = function(keypath, value) {
      var base, prop, _ref;
      base = this._baseForKeypath(keypath);
      if (base != null) {
        if ((_ref = Batman.Property.forBaseAndKey(base, keypath)) != null) {
          _ref.setValue(value);
        }
      } else if (typeof value !== "undefined") {
        base = this.target;
        base.set(keypath, value);
      }
      prop = Batman.Property.forBaseAndKey(base, keypath);
      this.observeProperty(prop);
      return value;
    };

    ContextObserver.prototype.die = function() {
      var property, _i, _len, _ref;
      if (this.DEAD) {
        console.warn("This context observer was already killed!");
        return;
      }
      this.DEAD = true;
      this.constructor.COUNT -= 1;
      this._logCount();
      _ref = this._properties;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        property = _ref[_i];
        if (property != null) {
          property.forget(this.forceUpdate);
        }
      }
      this._properties = null;
      return this.off();
    };

    ContextObserver.prototype._logCount = function() {
      if (this.constructor._logging) {
        return;
      }
      return this.constructor._logging = Batman.setImmediate((function(_this) {
        return function() {
          console.log("" + _this.constructor.COUNT + " ContextObservers");
          return _this.constructor._logging = false;
        };
      })(this));
    };

    return ContextObserver;

  })(Batman.Hash);

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
  _fn = function(tagName, tagFunc) {
    return Batman.DOM[tagName] = function() {
      var children, classes, descriptor, props, styles;
      props = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (classes = props != null ? props["class"] : void 0) {
        props.className = classes;
        delete props["class"];
      }
      if (styles = props != null ? props.style : void 0) {
        props.style = Batman.DOM.React.StyleAttributeBinding.prototype.styleStringToObject(styles);
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
      var _ref1, _ref2;
      reactDebug("getInitialState " + (((_ref1 = this.constructor) != null ? _ref1.displayName : void 0) || ((_ref2 = this.props) != null ? _ref2.key : void 0)));
      this._observeContext();
      return {};
    },
    willReceiveProps: function(nextProps) {
      var _ref1, _ref2;
      reactDebug("willReceiveProps " + (((_ref1 = this.constructor) != null ? _ref1.displayName : void 0) || ((_ref2 = this.props) != null ? _ref2.key : void 0)), nextProps);
      return this._observeContext(nextProps);
    },
    componentWillUnmount: function() {
      if (this._observer.component === this) {
        reactDebug("componentWillUnmount, killing observer");
        return this._observer.die();
      }
    },
    _observeContext: function(props) {
      var target, _ref1, _ref2;
      reactDebug("_observeContext", props);
      props || (props = this.props);
      if (props.contextObserver) {
        if ((this._observer != null) && this._observer !== props.contextObserver) {
          reactDebug("Killing observer because props.contextObserver was passed in");
          if ((_ref1 = this._observer) != null) {
            _ref1.die();
          }
        }
        if (this._observer == null) {
          return this._observer = props.contextObserver;
        }
      } else {
        target = props.contextTarget || (props.contextTarget = new Batman.Object);
        if ((this._observer != null) && target !== this._observer.target) {
          reactDebug("Killing observer because new target passed in");
          if ((_ref2 = this._observer) != null) {
            _ref2.die();
          }
          this._observer = null;
        }
        if (this._observer == null) {
          this.props.contextTarget = target;
          return this._observer = new Batman.ContextObserver({
            target: target,
            component: this
          });
        }
      }
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
    if (descriptor != null ? descriptor.children : void 0) {
      type = descriptor.type, props = descriptor.props, children = descriptor.children;
      newChildren = (function() {
        var _i, _len, _ref2, _results;
        _results = [];
        for (_i = 0, _len = children.length; _i < _len; _i++) {
          child = children[_i];
          if (((_ref2 = descriptor.props) != null ? _ref2.injectedContext : void 0) && child.type) {
            child.props || (child.props = {});
            child.props.injectedContext = descriptor.props.injectedContext;
          }
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

Batman.View.store.set('/animals/detail', '<p>\n  These details about&nbsp;\n  <span data-bind=\'animal.name\'></span>\n  &nbsp;were loaded from a different HTML file:\n  <ul data-context=\'animal\'>\n    <li data-bind=\'canFly | prepend \"Can Fly: \"\'></li>\n    <li data-bind=\'color | prepend \"Color: \"\'></li>\n    <li data-bind=\'animalClass\'></li>\n  </ul>\n</p>');
Batman.View.store.set('/animals/edit', '<div>\n  <div class=\"modal-header\">\n    <h2 class=\"modal-title\">\n      <span>Edit </span>\n      <span data-bind=\"currentAnimal.name\"></span>\n    </h2>\n  </div>\n  <div class=\"modal-body\">\n    <form data-event-submit=\"save | withArguments currentAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'currentAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>Name</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\"currentAnimal.name\"/>\n      </div>\n      <div class=\"checkbox\">\n        <label>\n          Can Fly?\n          <input type=\"checkbox\" class=\'checkbox\' data-bind=\'currentAnimal.canFly\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label data-foreach-animalclass=\'Animal.CLASSES\' class=\'radio-inline\'>\n          <span data-bind=\'animalclass\'></span>\n          <input type=\'radio\' data-bind-value=\'animalclass\' data-bind=\'currentAnimal.animalClass\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label>Color:</label>\n        <select class=\'form-control\' data-bind=\"currentAnimal.color\">\n          <option value=\'\'>Pick a color</option>\n          <option data-foreach-color=\'Animal.COLORS\' data-bind-value=\'color\' data-bind=\'color\'></option>\n        </select>\n      </div>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-success\" />\n    </form>\n  </div>\n  <div class=\"modal-footer\">\n    <button data-event-click=\'closeDialog\' class=\"btn\">Close</button>\n  </div>\n</div>');
Batman.View.store.set('/animals/index', '<h1>\n  All Animals\n  <small> (<span data-bind=\'\"Animal\" | pluralize animals.length\'></span>)</small>\n</h1>\n<ul class=\"list-unstyled\">\n  <li data-foreach-animal=\'animals\'>\n    <div class=\"row\">\n      <div class=\"col-xs-4\" data-context-canfly=\'animal.canFly\'>\n        <a data-route=\"routes.animals[animal]\">\n          <p class=\"lead text-warning\" data-removeclass-text-warning=\'canfly\' data-addclass-text-success=\'canfly\' data-addclass-text-danger=\'canfly | not\'>\n            <span data-bind=\'animal.name\'></span>\n            <span class=\"text-muted\" data-showif=\'animal.canFly\'> (can fly)</span>\n            <span class=\"text-muted\" data-hideif=\'animal.canFly\'> (can\'t fly)</span>\n          </p>\n        </a>\n      </div>\n      <div class=\"col-xs-4\">\n        <small data-showif=\'animal.color\' data-bind=\"animal.color | upcase | append \' \'\"></small>\n        <small data-bind=\"animal.animalClass | upcase\"></small>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'executeAction | withArguments \"edit\", animal\' class=\"btn\">Edit in Dialog</button>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'destroy | withArguments animal\' class=\"btn btn-danger\">Destroy</button>\n      </div>\n    </div>\n  </li>\n</ul>\n<div data-partial=\'\"animals/new_form\"\'></div>\n');
Batman.View.store.set('/animals/new_form', '<p class=\"row\">\n  <div class=\"well\">\n    <form data-formfor-animal=\'newAnimal\' data-event-submit=\"save | withArguments newAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'newAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>New Animal:</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\'newAnimal.name\'/>\n      </div>\n      <p>\n        Make a new animal:\n        <span data-bind=\"Animal.NAMES | join \', \' | prepend \' \' \"></span>\n      </p>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-primary\"/>\n    </form>\n  </div>\n</p>');
Batman.View.store.set('/animals/show', '<div>\n  <h1 data-bind=\'animal.name\'></h1>\n  <p>I put this page here to test data-route bindings.</p>\n  <p style=\'font-weight: 800;\' data-style-font-size=\'animal.fontSize\' data-style-color=\'animal.color\'>\n    This font-size is bound to <code>animal.name</code>.\n  </p>\n  <div data-partial=\'\"animals/detail\"\'></div>\n  <p>\n    <a data-route=\'routes.animals\' class=\'btn btn-primary\'>Go back</a>\n  </p>\n</div>');