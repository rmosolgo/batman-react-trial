(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.App = (function(_super) {
    __extends(App, _super);

    function App() {
      return App.__super__.constructor.apply(this, arguments);
    }

    App.root('animals#index');

    App.on('run', function() {
      this._observeModal();
      return this._seedData();
    });

    App._observeModal = function() {
      return Batman.DOM.Yield.observe('yields.modal.contentView', function(newValue, oldValue) {
        if (newValue != null) {
          return $('.modal').modal('show');
        }
      });
    };

    App._seedData = function() {
      var animal, n, totalAnimals, _i, _len, _ref, _results;
      totalAnimals = App.Animal.get('all.length');
      if (totalAnimals === 0) {
        _ref = ["Hedgehog", "Starfish", "Echidna"];
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

  App.ApplicationController = (function(_super) {
    __extends(ApplicationController, _super);

    function ApplicationController() {
      return ApplicationController.__super__.constructor.apply(this, arguments);
    }

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

    return ApplicationController;

  })(Batman.Controller);

  App.AnimalsController = (function(_super) {
    __extends(AnimalsController, _super);

    function AnimalsController() {
      return AnimalsController.__super__.constructor.apply(this, arguments);
    }

    AnimalsController.prototype.routingKey = 'animals';

    AnimalsController.prototype.index = function(params) {
      return this.set('newAnimal', new App.Animal);
    };

    AnimalsController.prototype.edit = function(animal) {
      this.set('currentAnimal', animal);
      return this.render({
        into: 'modal'
      });
    };

    return AnimalsController;

  })(App.ApplicationController);

  App.Animal = (function(_super) {
    __extends(Animal, _super);

    function Animal() {
      return Animal.__super__.constructor.apply(this, arguments);
    }

    Animal.resourceName = 'animal';

    Animal.persist(Batman.LocalStorage);

    Animal.encode('name');

    return Animal;

  })(Batman.Model);

  App.AnimalsIndexView = (function(_super) {
    __extends(AnimalsIndexView, _super);

    function AnimalsIndexView() {
      return AnimalsIndexView.__super__.constructor.apply(this, arguments);
    }

    AnimalsIndexView.prototype.saveAnimal = function(animal) {
      return animal.save((function(_this) {
        return function(err, r) {
          return _this.set('newAnimal', new App.Animal);
        };
      })(this));
    };

    AnimalsIndexView.prototype.destroyAnimal = function(animal) {
      return animal.destroy();
    };

    return AnimalsIndexView;

  })(Batman.View);

  App.AnimalsEditView = (function(_super) {
    __extends(AnimalsEditView, _super);

    function AnimalsEditView() {
      return AnimalsEditView.__super__.constructor.apply(this, arguments);
    }

    AnimalsEditView.prototype.saveAnimal = function(animal) {
      return animal.save(function() {
        return Batman.redirect("/");
      });
    };

    return AnimalsEditView;

  })(Batman.View);

}).call(this);

Batman.View.store.set('/animals/edit', '<div class=\"modal-header\"><h2 data-bind=\"&quot;Edit &quot; | append currentAnimal.name\" class=\"modal-title\"></h2></div><div class=\"modal-body\"><form data-formfor-animal=\"currentAnimal\" data-event-submit=\"saveAnimal | withArguments currentAnimal\"><div class=\"form-group\"><label>Name</label><input type=\"text\" data-bind=\"animal.name\" class=\"form-control\"/></div><input type=\"submit\" value=\"Save\" class=\"btn btn-success\"/></form></div><div class=\"modal-footer\"><button data-event-click=\"closeDialog\" class=\"btn\">Close</button></div>');
Batman.View.store.set('/animals/index', '<div class=\"row\"><h1>All Animals<small data-bind=\"Animal.loaded.length | append &quot;)&quot; | prepend &quot; (&quot;\"></small></h1></div><ul class=\"list-unstyled\"><li data-foreach-animal=\"Animal.all\"><div class=\"row\"><div class=\"col-xs-3\"><p data-bind=\"animal.name\" class=\"lead\"></p></div><div class=\"col-xs-1\"><button data-event-click=\"controllers.animals.executeAction | withArguments &quot;edit&quot;, animal\" class=\"btn\">Edit</button></div><div class=\"col-xs-1\"><button data-event-click=\"destroyAnimal | withArguments animal\" class=\"btn btn-danger\">Destroy</button></div></div></li></ul><p class=\"row\"><div class=\"well\"><form data-formfor-animal=\"newAnimal\" data-event-submit=\"saveAnimal | withArguments newAnimal\"><div class=\"form-group\"><label>New Animal:</label><input type=\"text\" data-bind=\"animal.name\" class=\"form-control\"/></div><input type=\"submit\" value=\"Save\" class=\"btn btn-primary\"/></form></div></p>');