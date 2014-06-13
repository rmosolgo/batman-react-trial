class Batman.DOM.React.RemoveClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @descriptor.props.className || ""
      className = className.replace("#{@attrArg}", "")
      # reactDebug "RemoveClassBinding removing #{@attrArg}"
      @safelySetProps({className})
    @descriptor