class Batman.DOM.React.PartialBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    contextObserver = @descriptor.contextObserver
    async = false
    Batman.reactComponentForHTMLPath @filteredValue, (componentClass) =>
      injectedContext = @descriptor.props.injectedContext
      partialComponent = componentClass({injectedContext, contextObserver})
      @descriptor = [partialComponent]
      if async
        contextObserver.forceUpdate()
    async = true
    @descriptor