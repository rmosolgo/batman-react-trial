class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.contextObserver.setContext(@attrArg, @filteredValue || null)
    @descriptor