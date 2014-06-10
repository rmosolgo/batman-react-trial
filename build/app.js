(function() {
  var tagFunc, tagName, _fn, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

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
      setTimeout((function(_this) {
        return function() {
          return _this._seedData();
        };
      })(this), 2000);
      return Batman.redirect("/");
    });

    App._seedData = function() {
      var animal, n, totalAnimals, _i, _len, _ref, _results;
      totalAnimals = App.Animal.get('all.length');
      if (totalAnimals === 0) {
        _ref = ["Spider", "Starfish", "Echidna"];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          n = _ref[_i];
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

  this.BatmanReactDebug = false;

  this.reactDebug = function() {
    if (BatmanReactDebug) {
      return console.log.apply(console, arguments);
    }
  };

  Batman.Controller.prototype.renderReact = function(options) {
    var action, component, componentClass, componentName, existingComponent, frame, targetYield, view, yieldName, yieldNode, _ref;
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
    yieldName = options.into || "main";
    targetYield = Batman.DOM.Yield.withName(yieldName);
    yieldNode = targetYield.containerNode;
    action = (frame != null ? frame.action : void 0) || this.get('action');
    componentName = Batman.helpers.camelize("" + (this.get('routingKey')) + "_" + action + "_component");
    componentClass = Batman.currentApp[componentName];
    if (!componentClass) {
      throw "No component for " + componentName + "!";
    }
    component = componentClass({
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
    reactDebug("rendered", componentName);
    return frame != null ? frame.finishOperation() : void 0;
  };

  Batman.ContextObserver = (function(_super) {
    __extends(ContextObserver, _super);

    function ContextObserver(_arg) {
      this.component = _arg.component, this.target = _arg.target;
      ContextObserver.__super__.constructor.call(this, {});
      this.forceUpdate = this._forceUpdate.bind(this);
      this.on("changed", this.forceUpdate);
    }

    ContextObserver.prototype._targets = function() {
      return [this.target, Batman.currentApp];
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
      base = this._baseForKeypath(keypath);
      prop = base.property(keypath);
      this.set(keypath, prop);
      prop.observe(this.forceUpdate);
      reactDebug("Observing " + prop.key + " on", prop.base);
      return prop.observe(function() {
        return reactDebug("forceUpdate because of " + prop.key);
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
      return (_ref = Batman.Property.forBaseAndKey(base, keypath)) != null ? _ref.setValue(value) : void 0;
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

    ContextObserver.prototype.die = function() {
      this.forEach((function(_this) {
        return function(keypathName, property) {
          reactDebug("ContextObserver forgetting " + keypathName);
          if (property != null) {
            property.forget(_this.forceUpdate);
          }
          return _this.unset(keypathName);
        };
      })(this));
      this.off();
      return this.forget();
    };

    return ContextObserver;

  })(Batman.Hash);

  Batman.createComponent = function(options) {
    options.mixins = options.mixins || [];
    options.mixins.push(Batman.ReactMixin);
    return React.createClass(options);
  };

  Batman.DOM.reactReaders = {
    bind: function(tagName, tagObject, value) {
      var contentValue;
      switch (tagName) {
        case "span":
          contentValue = tagObject._owner.sourceKeypath(value);
          if (tagObject.isMounted()) {
            return tagObject.setProps({
              children: contentValue
            });
          } else {
            return tagObject.props.children = [contentValue];
          }
      }
    }
  };

  _ref = React.DOM;
  _fn = function(tagName, tagFunc) {
    return Batman.DOM[tagName] = function() {
      var attrArg, bindingFunc, bindingName, children, key, prefix, props, tagObject, value, _ref1;
      props = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      tagObject = tagFunc.call.apply(tagFunc, [React.DOM, props].concat(__slice.call(children)));
      for (key in props) {
        value = props[key];
        if (!(key.substr(0, 5) === "data-")) {
          continue;
        }
        _ref1 = key.split("-"), prefix = _ref1[0], bindingName = _ref1[1], attrArg = _ref1[2];
        bindingFunc = Batman.DOM.reactReaders[bindingName];
        bindingFunc(tagName, tagObject, value, attrArg);
      }
      return tagObject;
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
    _contextualize: function(keypath) {
      var contextualizedFirstPart, firstPart, parts;
      if (this.dataContext == null) {
        return keypath;
      }
      parts = keypath.split(/\./);
      firstPart = parts.shift();
      contextualizedFirstPart = this.dataContext[firstPart] || firstPart;
      parts.unshift(contextualizedFirstPart);
      return parts.join(".");
    },
    updateKeypath: function(keypath) {
      keypath = this._contextualize(keypath);
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
          return _this._observer.setContext(keypath, value);
        };
      })(this);
    },
    sourceKeypath: function(keypath) {
      return this._observer.getContext(this._contextualize(keypath));
    },
    _observeContext: function(props) {
      var target;
      props || (props = this.props);
      target = props.target || props.controller;
      reactDebug("Observing context with target", target);
      if (this._observer) {
        this._observer.die();
      }
      return this._observer = new Batman.ContextObserver({
        target: target,
        component: this
      });
    },
    executeAction: function(actionName, params) {
      return (function(_this) {
        return function(e) {
          var actionParams;
          e.preventDefault();
          actionParams = params || e;
          return _this.props.controller.executeAction(actionName, actionParams);
        };
      })(this);
    },
    handleWith: function() {
      var handler, handlerName, withArguments;
      handlerName = arguments[0], withArguments = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      handler = this.sourceKeypath(handlerName);
      return (function(_this) {
        return function(e) {
          var callArgs;
          e.preventDefault();
          callArgs = withArguments || [e];
          return handler.apply(null, callArgs);
        };
      })(this);
    },
    enumerate: function(setName, itemName, generator) {
      var components, controller, displayName, iterationComponent, outerContext, render, set, _getKey;
      _getKey = this._getEnumerateKey;
      set = this.sourceKeypath(setName);
      this.sourceKeypath("" + setName + ".toArray");
      displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName.split(".")[0]);
      render = function() {
        return generator.call(this, this.props.item);
      };
      iterationComponent = Batman.createComponent({
        render: render,
        displayName: displayName
      });
      outerContext = this._observer.get("context");
      controller = this.props.controller;
      components = set.map(function(item) {
        var innerContext, innerProps, key, target;
        innerContext = Batman.extend({}, outerContext);
        innerContext[itemName] = item;
        target = new Batman.Object(innerContext);
        key = _getKey(item);
        innerProps = {
          controller: controller,
          target: target,
          item: item,
          key: key
        };
        return iterationComponent(innerProps);
      });
      return components;
    },
    _getEnumerateKey: function(item) {
      if (item.hashKey != null) {
        return item.hashKey();
      } else {
        return JSON.stringify(item);
      }
    },
    linkTo: function(routeQuery) {
      var actionPart, base, obj, objPart, part, parts, path, _i, _len, _ref1;
      if (routeQuery.substr(0, 6) !== 'routes') {
        path = routeQuery;
      } else {
        parts = routeQuery.split(/\[/);
        base = Batman.currentApp;
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          if (part.indexOf(']') > -1) {
            _ref1 = part.split(/\]\./), objPart = _ref1[0], actionPart = _ref1[1];
            obj = this.sourceKeypath(objPart);
            base = base.get(obj);
            base = base.get(actionPart);
          } else {
            base = base.get(part);
          }
        }
        path = base.get('path');
      }
      return Batman.navigator.linkTo(path);
    },
    redirect: function(routeQuery) {
      var path;
      path = this.linkTo(routeQuery);
      return function(e) {
        e.stopPropagation();
        return Batman.redirect(path);
      };
    },
    addClass: function(className, keypath, renderFunc) {
      var node, val;
      val = this.sourceKeypath(keypath);
      node = renderFunc();
      if (val) {
        node.className += " " + className;
      }
      return node;
    },
    _showIf: function(val, callback) {
      if (val) {
        return callback.call(this);
      } else {
        return void 0;
      }
    },
    showIf: function() {
      var callback, keypath, keypaths, val, _i, _j, _len;
      keypaths = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      val = true;
      for (_j = 0, _len = keypaths.length; _j < _len; _j++) {
        keypath = keypaths[_j];
        val = val && this.sourceKeypath(keypath);
        if (!val) {
          return this._showIf(!!val, callback);
        }
      }
      return this._showIf(!!val, callback);
    },
    hideIf: function() {
      var callback, keypath, keypaths, val, _i, _j, _len;
      keypaths = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
      val = true;
      for (_j = 0, _len = keypaths.length; _j < _len; _j++) {
        keypath = keypaths[_j];
        val = val && this.sourceKeypath(keypath);
        if (!val) {
          return this._showIf(!val, callback);
        }
      }
      return this._showIf(!val, callback);
    }
  };

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
      this.set('newAnimal', new App.Animal);
      this.set('animals', App.Animal.get('all.sortedBy.name'));
      return this.renderReact();
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

    return Animal;

  })(Batman.Model);

}).call(this);
