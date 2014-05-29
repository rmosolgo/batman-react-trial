(function() {
  var BatmanReactDebug, reactDebug,
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

  BatmanReactDebug = true;

  reactDebug = function() {
    if (BatmanReactDebug) {
      return console.log.apply(console, arguments);
    }
  };

  Batman.Controller.prototype.renderReact = function(options) {
    var action, component, componentClass, componentName, existingComponent, frame, targetYield, yieldName, yieldNode, _ref;
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

    ContextObserver.prototype._forceUpdate = function() {
      if (this.component.isMounted()) {
        return this.component.forceUpdate();
      } else {
        return reactDebug("Wasn't mounted", this.component);
      }
    };

    ContextObserver.prototype._property = function(keypath) {
      var property;
      property = this.getOrSet(keypath, (function(_this) {
        return function() {
          var prop;
          prop = new Batman.Keypath(_this.target, keypath).terminalProperty() || new Batman.Keypath(Batman.currentApp, keypath).terminalProperty();
          if (prop == null) {
            reactDebug("" + keypath + " wasn’t found in context for", _this.target);
          } else {
            prop.observe(function() {
              reactDebug("forceUpdate because of " + keypath);
              return _this.forceUpdate();
            });
          }
          return prop;
        };
      })(this));
      return property;
    };

    ContextObserver.prototype.getContext = function(keypath) {
      var _ref;
      return (_ref = this._property(keypath)) != null ? _ref.getValue() : void 0;
    };

    ContextObserver.prototype.setContext = function(keypath, value) {
      return this._property(keypath).setValue(value);
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
          property.forget(_this.forceUpdate);
          return _this.unset(keypathName);
        };
      })(this));
      this.off();
      return this.forget();
    };

    return ContextObserver;

  })(Batman.Hash);

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
    updateKeypath: function(keypath) {
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
      return this._observer.getContext(keypath);
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
      var handlerName, withArguments;
      handlerName = arguments[0], withArguments = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return (function(_this) {
        return function(e) {
          var callArgs;
          e.preventDefault();
          callArgs = withArguments || [e];
          return _this.props.controller[handlerName].apply(_this.props.controller, callArgs);
        };
      })(this);
    },
    enumerate: function(setName, itemName, generator) {
      var components, controller, displayName, iterationComponent, outerContext, render, set, _getKey;
      _getKey = this._getEnumerateKey;
      set = this.sourceKeypath(setName);
      this.sourceKeypath("" + setName + ".toArray");
      displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName);
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
        target = new Batman.Hash(innerContext);
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
      var base, obj, part, parts, path, _i, _len;
      if (routeQuery.substr(0, 6) !== 'routes') {
        path = routeQuery;
      } else {
        parts = routeQuery.split(/\[/);
        base = Batman.currentApp;
        for (_i = 0, _len = parts.length; _i < _len; _i++) {
          part = parts[_i];
          if (part.indexOf(']') > -1) {
            obj = this.sourceKeypath(part.replace(/\]/, ''));
            base = base.get(obj);
          } else {
            base = base.get(part);
          }
        }
        path = base.get('path');
      }
      return Batman.navigator.linkTo(path);
    }
  };

  Batman.createComponent = function(options) {
    options.mixins = options.mixins || [];
    options.mixins.push(Batman.ReactMixin);
    return React.createClass(options);
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
      var modalYield, _ref;
      $('.modal').modal('hide');
      modalYield = Batman.DOM.Yield.get('yields.modal');
      if ((_ref = modalYield.get('contentView')) != null) {
        _ref.die();
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
