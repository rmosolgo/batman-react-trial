/** @jsx React.DOM */


App.AnimalsIndexComponent = Batman.createComponent({
  render: function(){
    var animals = this.enumerate("animals", "animal", function(animal) {
              var extinct = ""
              if (this.sourceKeypath('animal.extinct')) {
                extinct = (React.DOM.span( {className:"text-muted"}, " (extinct)"))
              }
              return (
              React.DOM.li( {key:animal.get('_batmanID')}, 
                React.DOM.div( {className:"row"}, 
                  React.DOM.div( {className:"col-xs-6"}, 
                    React.DOM.p( {className:"lead"}, 
                      this.sourceKeypath('animal.name'),", ", this.sourceKeypath("animal.animalClass"),
                      extinct
                    )
                  ),
                  React.DOM.div( {className:"col-xs-3"}, 
                    React.DOM.button( {onClick:this.executeAction("edit", animal), className:"btn"}, "Edit ", animal.get('name'), " in Dialog")
                  ),
                  React.DOM.div( {className:"col-xs-2"}, 
                    React.DOM.button( {onClick:this.handleWith("destroy", animal), className:"btn btn-danger"}, "Destroy")
                  )
                )
              )
                )
          })
    return (
      React.DOM.div( {className:"row"}, 
        React.DOM.h1(null, 
          "All Animals",
          /* <small data-bind="Animal.loaded.length | append &quot;)&quot; | prepend &quot; (&quot;"></small> */
          React.DOM.small(null, " (",this.sourceKeypath("animals.length"),")")
        ),
        React.DOM.ul( {className:"list-unstyled"}, 
          animals
        ),
        React.DOM.p( {className:"row"}, 
          React.DOM.div( {className:"well"}, 
            React.DOM.form( {onSubmit:this.handleWith("save", [this.sourceKeypath('newAnimal')])}, 
              React.DOM.div( {className:"form-group"}, 
                React.DOM.label(null, "New Animal:"),
                React.DOM.input( {type:"text", className:"form-control", value:this.sourceKeypath("newAnimal.name"), onChange:this.updateKeypath('newAnimal.name')})
              ),
              React.DOM.input( {type:"submit", value:"Save", className:"btn btn-primary"})
            )
          )
        ),
        React.DOM.ul(null, 
          React.DOM.li(null, "To Do:"),
          React.DOM.li(null, "Routes"),
          React.DOM.li(null, "Select binding")
        )
      )
      )
  }
})

App.AnimalsEditComponent = React.createClass({displayName: 'AnimalsEditComponent',
  mixins: [Batman.ReactMixin],
  render: function() {
    return (
      React.DOM.div(null, 
        React.DOM.div( {className:"modal-header"}, 
          React.DOM.h2( {className:"modal-title"}, 
            React.DOM.span(null, "Edit"),
            React.DOM.span(null,  " ", this.sourceKeypath("currentAnimal.name"))
          )
        ),
        React.DOM.div( {className:"modal-body"}, 
          React.DOM.form( {onSubmit:this.handleWith("save", this.sourceKeypath('currentAnimal'))}, 
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label(null, "Name"),
              React.DOM.input( {type:"text", className:"form-control", value:this.sourceKeypath("currentAnimal.name"), onChange:this.updateKeypath('currentAnimal.name')})
            ),
            React.DOM.div( {className:"checkbox"}, 
              React.DOM.label(null, 
                "Extinct",
                React.DOM.input( {type:"checkbox", className:"checkbox", checked:this.sourceKeypath("currentAnimal.extinct"), onChange:this.updateKeypath('currentAnimal.extinct')})
              )
            ),
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label( {className:"radio-inline"}, 
                "Mammal",
                React.DOM.input( {type:"radio", value:"Mammal", checked:this.sourceKeypath('currentAnimal.animalClass') == "Mammal", onChange:this.updateKeypath('currentAnimal.animalClass')} )
              ),
              React.DOM.label( {className:"radio-inline"}, 
                "Fish",
                React.DOM.input( {type:"radio", value:"Fish",  checked:this.sourceKeypath('currentAnimal.animalClass') == "Fish",  onChange:this.updateKeypath('currentAnimal.animalClass')} )
              )
            ),
            React.DOM.input( {type:"submit", value:"Save", className:"btn btn-success"} )
          )
        ),
        React.DOM.div( {className:"modal-footer"}, 
          React.DOM.button( {onClick:this.handleWith("closeDialog"), className:"btn"}, "Close")
        )
      )
    );
  }
});