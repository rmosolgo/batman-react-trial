/** @jsx React.DOM */

Batman.ReactMixin = {
  getInitialState: function(){
    this._observeContext()
    return {}
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
    this._observeContext(nextProps.controller)
  },
  _observeContext: function(target) {
    var target = target || this.props.controller
    if (!this._observer) {
      console.log('creating observer')
      this._observer = new Batman.ContextObserver({target: target, component: this })
    } else if (this._observer.target === target) {
      console.log("Identical context", this._observer.target, target)
    } else {
      console.log("updating context", target)
      this._observer.set('context', target)
    }
  },
  executeAction: function(actionName, params){
    var cmt = this
    return function(e) {
      var ctx = cmt._observer.get('context')
      var actionParams = params || [e, ctx]
      cmt.props.controller.executeAction(actionName, actionParams)
    }
  },
  handleWith: function(handlerName, withArguments) {
    var cmt = this
    var controller = cmt.props.controller
    return function(e) {
      e.preventDefault()
      var ctx = cmt._observer.get('context')
      var callArgs = withArguments || [e, ctx]
      controller[handlerName].apply(controller, callArgs)
    }
  },
  enumerate: function(setName, itemName, generator) {
    var set = this.sourceKeypath(setName)
    var displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName)
    var outerContext = this._observer.get('context')
    var controller = this.props.controller
    var idx = -1
    var iterationComponent = Batman.createComponent({
      displayName: displayName,
      render: function() {
        return generator.call(this, this.props.item)
      }
    })
    var components = set.map(function(item){
      idx++
      // console.log(itemName, idx, JSON.stringify(item) )
      var innerContext = Batman.extend({}, outerContext)
      innerContext[itemName] = item
      console.log("innerContext", innerContext)
      var target = new Batman.Hash(innerContext)
      var innerProps = {
        controller: controller,
        item: item,
      }
      var cpt =  iterationComponent(innerProps)
      try {
        cpt._observeContext(target)
        renderedComponent = cpt.render()
      } finally {
      }
      window.lastCpt = cpt
      return renderedComponent
    })
    return components
  }
}

Batman.createComponent = function(options){
  options.mixins = options.mixins || []
  options.mixins.push(Batman.ReactMixin)
  return React.createClass(options)
}

App.AnimalsIndexComponent = React.createClass({displayName: 'AnimalsIndexComponent',
  mixins: [Batman.ReactMixin],
  render: function(){
    var animals = this.enumerate("animals", "animal", function(animal) {
            return (
              React.DOM.li( {key:animal.get('_batmanID')}, 
                React.DOM.div( {className:"row"}, 
                  React.DOM.div( {className:"col-xs-3"}, 
                    React.DOM.p( {className:"lead"}, this.sourceKeypath('animal.name'))
                  ),
                  React.DOM.div( {className:"col-xs-2"}, 
                    React.DOM.button( {onClick:this.executeAction("edit", animal), className:"btn"}, "Edit in Dialog")
                  ),
                  React.DOM.div( {className:"col-xs-2"}, 
                    React.DOM.button( {onClick:this.executeAction("destroy", animal), className:"btn btn-danger"}, "Destroy")
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
            React.DOM.form( {'data-formfor-animal':"newAnimal", 'data-event-submit':"saveAnimal | withArguments newAnimal"}, 
              React.DOM.div( {className:"form-group"}, 
                React.DOM.label(null, "New Animal:"),
                React.DOM.input( {type:"text", 'data-bind':"animal.name", className:"form-control"})
              ),
              React.DOM.input( {type:"submit", value:"Save", className:"btn btn-primary"})
            )
          )
        ),
        React.DOM.ul(null, 
          React.DOM.li(null, "To Do:"),
          React.DOM.li(null, "Iteration"),
          React.DOM.li(null, "Routes"),
          React.DOM.li(null, "Checked Binding"),
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
          React.DOM.form( {onSubmit:this.handleWith("saveAnimal")}, 
            React.DOM.div( {className:"form-group"}, 
              React.DOM.label(null, "Name"),
              React.DOM.span(null, this.sourceKeypath('currentAnimal.name')),
              React.DOM.input( {type:"text", className:"form-control", value:this.sourceKeypath("currentAnimal.name"), onChange:this.updateKeypath('currentAnimal.name')})
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