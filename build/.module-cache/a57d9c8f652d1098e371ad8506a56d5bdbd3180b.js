/** @jsx React.DOM */

Batman.ReactMixin = {
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
}

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
          React.DOM.button( {onClick:this.executeAction("closeDialog"), className:"btn"}, "Close")
        )
      )
    );
  }
});

App.AnimalsIndexComponent = React.createClass({displayName: 'AnimalsIndexComponent',
  mixins: [Batman.ReactMixin],
  render: function(){
    return (
      React.DOM.div( {className:"row"}, 
        React.DOM.h1(null, 
          "All Animals",
          /* <small data-bind="Animal.loaded.length | append &quot;)&quot; | prepend &quot; (&quot;"></small> */
          React.DOM.small(null, " (",this.sourceKeypath("animals.length"),")")
        ),
        React.DOM.ul( {className:"list-unstyled"}, 
          React.DOM.li( {'data-foreach-animal':"Animal.all"}, 
            React.DOM.div( {className:"row"}, 
              React.DOM.div( {className:"col-xs-3"}, 
                React.DOM.p( {className:"lead"}/* this.sourceKeypath("animal.name") */)
              ),
              React.DOM.div( {className:"col-xs-2"}, 
                React.DOM.button( {'data-event-click':"controllers.animals.executeAction | withArguments \"edit\", animal", className:"btn"}, "Edit in Dialog")
              ),
              React.DOM.div( {className:"col-xs-2"}, 
                React.DOM.button( {'data-event-click':"destroyAnimal | withArguments animal", className:"btn btn-danger"}, "Destroy")
              )
            )
          )
        ),
        React.DOM.p( {className:"row"}, 
          React.DOM.div( {className:"well"}, 
            React.DOM.form( {'data-formfor-animal':"newAnimal", 'data-event-submit':"saveAnimal | withArguments newAnimal"}, 
              React.DOM.div( {className:"form-group"}, 
                React.DOM.label(null, "New Animal:"),
                React.DOM.input( {type:"text", 'data-bind':"animal.name", className:"form-control"})
              ),
              React.DOM.input( {type:"submit", value:"Save", className:"btn btn-primary"})
            )
          )
        )
      )
      )
  }
})