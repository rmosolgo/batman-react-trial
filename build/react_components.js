// Generated by CoffeeScript undefined
App.AnimalsShowComponent = Batman.createComponent({
  render: function() {
    return React.DOM.div(null, React.DOM.h1(null, this.sourceKeypath('animal.name')), React.DOM.p(null, "This is just an example of routing."), React.DOM.a({
      "href": this.linkTo('routes.animals'),
      "className": 'btn btn-primary'
    }, "Go back"));
  }
});

App.AnimalsIndexComponent = Batman.createComponent({
  render: function() {
    var animals;
    animals = this.enumerate("animals", "animal", function(animal) {
      var canFly;
      canFly = "";
      if (this.sourceKeypath('animal.canFly')) {
        canFly = React.DOM.span({
          "className": "text-muted"
        }, " (can fly)");
      }
      return React.DOM.li({
        "key": animal.get('_batmanID')
      }, React.DOM.div({
        "className": "row"
      }, React.DOM.div({
        "className": "col-xs-6"
      }, React.DOM.a({
        "href": this.linkTo("routes.animals[animal]")
      }, React.DOM.p({
        "className": "lead"
      }, this.sourceKeypath('animal.name'), canFly))), React.DOM.div({
        "className": "col-xs-2"
      }, React.DOM.small(null, this.sourceKeypath("animal.animalClass"))), React.DOM.div({
        "className": "col-xs-2"
      }, React.DOM.button({
        "onClick": this.executeAction("edit", animal),
        "className": "btn"
      }, "Edit in Dialog")), React.DOM.div({
        "className": "col-xs-2"
      }, React.DOM.button({
        "onClick": this.handleWith("destroy", animal),
        "className": "btn btn-danger"
      }, "Destroy"))));
    });
    return React.DOM.div({
      "className": "row"
    }, React.DOM.h1(null, "All Animals", React.DOM.small(null, " (", this.sourceKeypath("animals.length"), ")")), React.DOM.ul({
      "className": "list-unstyled"
    }, animals), React.DOM.p({
      "className": "row"
    }, React.DOM.div({
      "className": "well"
    }, React.DOM.form({
      "onSubmit": this.handleWith("save", this.sourceKeypath('newAnimal'))
    }, React.DOM.div({
      "className": "form-group"
    }, React.DOM.label(null, "New Animal:"), React.DOM.input({
      "type": "text",
      "className": "form-control",
      "value": this.sourceKeypath("newAnimal.name"),
      "onChange": this.updateKeypath('newAnimal.name')
    })), React.DOM.input({
      "type": "submit",
      "value": "Save",
      "className": "btn btn-primary"
    })))));
  }
});

App.AnimalsEditComponent = Batman.createComponent({
  render: function() {
    return React.DOM.div(null, React.DOM.div({
      "className": "modal-header"
    }, React.DOM.h2({
      "className": "modal-title"
    }, React.DOM.span(null, "Edit"), React.DOM.span(null, " ", this.sourceKeypath("currentAnimal.name")))), React.DOM.div({
      "className": "modal-body"
    }, React.DOM.form({
      "onSubmit": this.handleWith("save", this.sourceKeypath('currentAnimal'))
    }, React.DOM.div({
      "className": "form-group"
    }, React.DOM.label(null, "Name"), React.DOM.input({
      "type": "text",
      "className": "form-control",
      "value": this.sourceKeypath("currentAnimal.name"),
      "onChange": this.updateKeypath('currentAnimal.name')
    })), React.DOM.div({
      "className": "checkbox"
    }, React.DOM.label(null, "Can Fly?", React.DOM.input({
      "type": "checkbox",
      "className": 'checkbox',
      "checked": this.sourceKeypath("currentAnimal.canFly"),
      "onChange": this.updateKeypath('currentAnimal.canFly')
    }))), React.DOM.div({
      "className": 'form-group'
    }, this.enumerate('Animal.CLASSES', 'animalClass', function(animalClass) {
      return React.DOM.label({
        "className": 'radio-inline'
      }, animalClass, React.DOM.input({
        "type": 'radio',
        "value": animalClass,
        "checked": this.sourceKeypath('currentAnimal.animalClass') === animalClass,
        "onChange": this.updateKeypath('currentAnimal.animalClass')
      }));
    })), React.DOM.div({
      "className": 'form-group'
    }, React.DOM.label(null, "Color:"), React.DOM.select({
      "className": 'form-control',
      "value": this.sourceKeypath("currentAnimal.color"),
      "onChange": this.updateKeypath("currentAnimal.color")
    }, this.enumerate("Animal.COLORS", 'color', function(color) {
      return React.DOM.option({
        "key": color,
        "value": color
      }, color);
    }))), React.DOM.input({
      "type": "submit",
      "value": "Save",
      "className": "btn btn-success"
    }))), React.DOM.div({
      "className": "modal-footer"
    }, React.DOM.button({
      "onClick": this.handleWith("closeDialog"),
      "className": "btn"
    }, "Close")));
  }
});
