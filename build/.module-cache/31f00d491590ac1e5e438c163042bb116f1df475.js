/** @jsx React.DOM */

App.AnimalsEditComponent = React.createClass({displayName: 'AnimalsEditComponent',
  getInitialState: function(){
    this._observeContext(this.props.context)
    return this._observer.get('reactState')
  },
  updateKeypath: function (keypath) {
    var cmt = this;
    return function(e) {
      console.log("updating " + keypath + " to: ", e.target.value)
      cmt._observer.setContext(keypath, e.target.value)
    }
  },
  sourceKeypath: function(keypath) {
    return this._observer.getContext(keypath)
  },
  componentWillReceiveProps: function(nextProps) {
    console.log("next props", JSON.stringify(nextProps.context))
    this._observeContext(nextProps.context)
  },
  _observeContext: function(context) {
    if (!this._observer) {
      console.log('creating observer')
      this._observer = new Batman.ContextObserver({context: context, component: this })
    } else if (this._observer.get('context') === context) {
      console.log("Identical context", this._observer.get('context._batmanID'), context.get('_batmanID'))
    } else {
      console.log("updating context", context)
      this._observer.set('context', context)
    }
  },
  executeAction: function(actionName){
    var cmt = this
    return function(e) {
      var ctx = cmt._observer.get('context')
      cmt.props.controller[actionName](e, ctx)
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
          React.DOM.form( {onSubmit:this.executeAction("saveAnimal")}, 
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