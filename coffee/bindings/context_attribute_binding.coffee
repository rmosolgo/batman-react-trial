class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.props.injectedContext ||= {}
    @descriptor.props.injectedContext[@attrArg] = @filteredValue
    @descriptor