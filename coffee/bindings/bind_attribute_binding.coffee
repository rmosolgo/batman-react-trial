class Batman.DOM.React.BindAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    newProps = {}
    newProps[@attrArg] = @filteredValue
    # console.log "BindAttributeBinding #{@get("_batmanID")} setting #{@tagName} #{@tagObject.props.type} #{@attrArg}=#{newProps[@attrArg]}", @tagObject.props.children
    @safelySetProps(newProps)
    @tagObject