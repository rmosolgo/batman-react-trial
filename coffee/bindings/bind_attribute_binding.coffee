class Batman.DOM.React.BindAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    newProps = {}
    newProps[@attrArg] = @filteredValue
    @safelySetProps(newProps)
    @descriptor