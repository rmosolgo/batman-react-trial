/** @jsx React.DOM */

App.AnimalsEditComponent = React.createClass({displayName: 'AnimalsEditComponent',
  updateKeypath: function (keypath) {
    var controller = this.props.controller;
    return function(e) {
      debugger
      controller.set(keypath, e.target.value)
    }
  },
  render: function() {
    return (
      React.DOM.div(null, 
        React.DOM.div( {className:"modal-header"}, 
          React.DOM.h2( {className:"modal-title"}, 
            React.DOM.span(null, "Edit"),
            React.DOM.span( {'data-bind':"currentAnimal.name"} )
          )
        ),
        React.DOM.div( {className:"modal-body"}, 
          React.DOM.form( {'data-formfor-animal':"currentAnimal", onSubmit:this.props.controller.saveAnimal}, 
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label(null, "Name"),
              React.DOM.input( {type:"text", className:"form-control", onChange:this.updateKeypath('currentAnimal.name')})
            ),
            React.DOM.input( {type:"submit", value:"Save", className:"btn btn-success"} )
          )
        ),
        React.DOM.div( {className:"modal-footer"}, 
          React.DOM.button( {'data-event-click':"closeDialog", className:"btn"}, "Close")
        )
      )
    );
  }
});