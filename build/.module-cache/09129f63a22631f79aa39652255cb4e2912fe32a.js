/** @jsx React.DOM */

App.AnimalsEditComponent = React.createClass({displayName: 'AnimalsEditComponent',
  updateKeypath: function (keypath) {
    var controller = this.props.controller;
    return function(e) {
      controller.set(keypath, e.target.value)
    }
  },
  sourceKeypath: function(keypath) {
    this._observeKeypath(keypath)
    console.log("evaluating sourceKeypath for " + keypath)
    return this.props.controller.get(keypath)
  },
  _observeKeypath: function(keypath) {
    if (!this._observer) {
      this._observer = new Batman.Object({controller: this.props.controller, component: this })
      this._observer.observers = {}
    }
    var component = this;
    if (!this._observer.observers[keypath]) {
      console.log("observing " + keypath)
      this._observer.observe('controller.' + keypath, function(newValue, oldValue){
        console.log("updating to ", newValue)
        component.forceUpdate()
      })
      this._observer.observers[keypath] = true
    }
  },
  die: function(){
    console.log("Unmounting ...")
    for (key in this._observer.observers) {
      console.log(" ... forgetting " + key)
      this._observer.forget(key)
    }
  },
  render: function() {
    return (
      React.DOM.div(null, 
        React.DOM.div( {className:"modal-header"}, 
          React.DOM.h2( {className:"modal-title"}, 
            React.DOM.span(null, "Edit"),
            React.DOM.span(null, this.sourceKeypath("currentAnimal.name"))
          )
        ),
        React.DOM.div( {className:"modal-body"}, 
          React.DOM.form( {onSubmit:this.props.controller.saveAnimal}, 
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label(null, "Name"),
              React.DOM.input( {type:"text", className:"form-control", defaultValue:this.sourceKeypath("currentAnimal.name"), onChange:this.updateKeypath('currentAnimal.name')})
            ),
            React.DOM.input( {type:"submit", value:"Save", className:"btn btn-success"} )
          )
        ),
        React.DOM.div( {className:"modal-footer"}, 
          React.DOM.button( {onClick:this.props.controller.closeDialog, className:"btn"}, "Close")
        )
      )
    );
  }
});