/** @jsx React.DOM */

App.AnimalsEditComponent = React.createClass({displayName: 'AnimalsEditComponent',
  getInitialState: function(){
    return {}
  },
  updateKeypath: function (keypath) {
    var context = this.props.context;
    return function(e) {
      console.log("updating " + keypath + " to: ", e.target.value)
      context.set(keypath, e.target.value)
    }
  },
  sourceKeypath: function(keypath) {
    this._observeKeypath(keypath)
    var val = this.state[keypath]
    console.log("evaluating sourceKeypath for " + keypath + ": ", val)
    return val
  },
  _observeKeypath: function(keypath) {
    if (!this._observer) {
      this._observer = new Batman.Object({context: this.props.context, component: this })
      this._observer.observers = {}
    }
    var component = this;
    if (!this._observer.observers[keypath]) {
      console.log("observing " + keypath)
      this._observer.observe('context.' + keypath, function(newValue, oldValue){
        newState = {}
        newState[keypath] = newValue
        console.log("updating " + keypath + " to ", newState)
        component.setState(newState)
      })
      this._observer.observers[keypath] = true
    }
  },
  die: function(){
    console.log("Unmounting ...")
    for (key in this._observer.observers) {
      console.log(" ... forgetting " + key)
      this._observer.forget('context.' + key)
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
              React.DOM.span(null, this.sourceKeypath('currentAnimal.name')),
              React.DOM.input( {type:"text", className:"form-control", value:this.sourceKeypath("currentAnimal.name"), onChange:this.updateKeypath('currentAnimal.name')})
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