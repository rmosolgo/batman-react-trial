class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.context = @descriptor.context.injectContext(@attrArg, @filteredValue)
    @descriptor