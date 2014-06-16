class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    newContext =  @descriptor.context.injectContextAttribute(@attrArg, @filteredValue)
    # console.log "Added context #{@attrArg}", newContext.get(@attrArg)
    @descriptor.context = newContext
    @descriptor