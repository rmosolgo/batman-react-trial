// Generated by CoffeeScript undefined
App.AnimalsShowComponent = Batman.createComponent({
  render: function() {
    return Batman.DOM.div(null, Batman.DOM.h1(null, this.sourceKeypath('animal.name')), Batman.DOM.p(null, "This is just an example of routing."), Batman.DOM.a({
      "href": this.linkTo('routes.animals'),
      "className": 'btn btn-primary'
    }, "Go back"));
  }
});

App.AnimalsIndexComponent = Batman.createComponent({
  displayName: "AnimalsIndexComponent",
  render: function() {
    var animals, animalsList;
    animals = this.enumerate("animals", "animal", function(animal) {
      var canFly;
      canFly = "";
      if (this.sourceKeypath('animal.canFly')) {
        canFly = Batman.DOM.span({
          "className": "text-muted"
        }, " (can fly)");
      }
      return Batman.DOM.li(null, Batman.DOM.div({
        "className": "row"
      }, Batman.DOM.div({
        "className": "col-xs-6"
      }, Batman.DOM.a({
        "href": this.linkTo("routes.animals[animal]")
      }, Batman.DOM.p({
        "className": "lead"
      }, this.sourceKeypath('animal.name'), canFly))), Batman.DOM.div({
        "className": "col-xs-2"
      }, Batman.DOM.small(null, this.sourceKeypath("animal.animalClass"))), Batman.DOM.div({
        "className": "col-xs-2"
      }, Batman.DOM.button({
        "onClick": this.executeAction("edit", animal),
        "className": "btn"
      }, "Edit in Dialog")), Batman.DOM.div({
        "className": "col-xs-2"
      }, Batman.DOM.button({
        "onClick": this.handleWith("destroy", animal),
        "className": "btn btn-danger"
      }, "Destroy"))));
    });
    animalsList = "";
    if (animals.length) {
      animalsList = Batman.DOM.ul({
        "className": "list-unstyled"
      }, animals);
    }
    return Batman.DOM.div({
      "className": "row"
    }, Batman.DOM.h1(null, "All Animals", Batman.DOM.small(null, " (", this.sourceKeypath("animals.length"), ")")), animalsList, Batman.DOM.p({
      "className": "row"
    }, Batman.DOM.div({
      "className": "well"
    }, Batman.DOM.form({
      "onSubmit": this.handleWith("save", this.sourceKeypath('newAnimal'))
    }, Batman.DOM.ul({
      "className": 'list-unstyled'
    }, this.enumerate('newAnimal.errors', 'error', function() {
      return Batman.DOM.li({
        "className": 'alert alert-danger'
      }, this.sourceKeypath('error.fullMessage'));
    })), Batman.DOM.div({
      "className": "form-group"
    }, Batman.DOM.label(null, "New Animal:"), Batman.DOM.input({
      "type": "text",
      "className": "form-control",
      "value": this.sourceKeypath("newAnimal.name"),
      "onChange": this.updateKeypath('newAnimal.name')
    })), Batman.DOM.p(null, "Make a new animal: ", App.Animal.NAMES.join(", ")), Batman.DOM.input({
      "type": "submit",
      "value": "Save",
      "className": "btn btn-primary"
    })))));
  }
});

App.AnimalsEditComponent = Batman.createComponent({
  render: function() {
    return Batman.DOM.div(null, Batman.DOM.div({
      "className": "modal-header"
    }, Batman.DOM.h2({
      "className": "modal-title"
    }, Batman.DOM.span(null, "Edit"), Batman.DOM.span(null, " ", this.sourceKeypath("currentAnimal.name")))), Batman.DOM.div({
      "className": "modal-body"
    }, Batman.DOM.form({
      "onSubmit": this.handleWith("save", this.sourceKeypath('currentAnimal'))
    }, Batman.DOM.ul({
      "className": 'list-unstyled'
    }, this.enumerate('currentAnimal.errors', 'error', function() {
      return Batman.DOM.li({
        "className": 'alert alert-danger'
      }, this.sourceKeypath('error.fullMessage'));
    })), Batman.DOM.div({
      "className": "form-group"
    }, Batman.DOM.label(null, "Name"), Batman.DOM.input({
      "type": "text",
      "className": "form-control",
      "value": this.sourceKeypath("currentAnimal.name"),
      "onChange": this.updateKeypath('currentAnimal.name')
    })), Batman.DOM.div({
      "className": "checkbox"
    }, Batman.DOM.label(null, "Can Fly?", Batman.DOM.input({
      "type": "checkbox",
      "className": 'checkbox',
      "checked": this.sourceKeypath("currentAnimal.canFly"),
      "onChange": this.updateKeypath('currentAnimal.canFly')
    }))), Batman.DOM.div({
      "className": 'form-group'
    }, this.enumerate('Animal.CLASSES', 'animalClass', function(animalClass) {
      return Batman.DOM.label({
        "key": animalClass,
        "className": 'radio-inline'
      }, animalClass, Batman.DOM.input({
        "type": 'radio',
        "value": animalClass,
        "checked": this.sourceKeypath('currentAnimal.animalClass') === animalClass,
        "onChange": this.updateKeypath('currentAnimal.animalClass')
      }));
    })), Batman.DOM.div({
      "className": 'form-group'
    }, Batman.DOM.label(null, "Color:"), Batman.DOM.select({
      "className": 'form-control',
      "value": this.sourceKeypath("currentAnimal.color"),
      "onChange": this.updateKeypath("currentAnimal.color")
    }, this.enumerate("Animal.COLORS", 'color', function(color) {
      return Batman.DOM.option({
        "key": color,
        "value": color
      }, color);
    }))), Batman.DOM.input({
      "type": "submit",
      "value": "Save",
      "className": "btn btn-success"
    }))), Batman.DOM.div({
      "className": "modal-footer"
    }, Batman.DOM.button({
      "onClick": this.handleWith("closeDialog"),
      "className": "btn"
    }, "Close")));
  }
});
