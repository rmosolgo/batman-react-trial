class Batman.DOM.React.ContextBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    newContext = @descriptor.context.injectContextTarget(@filteredValue)
    @descriptor.context = newContext
    @descriptor