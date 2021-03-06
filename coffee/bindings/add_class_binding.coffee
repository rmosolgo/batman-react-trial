class Batman.DOM.React.AddClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @descriptor.props.className || ""
      className += " #{@attrArg}"
      # reactDebug "AddClassBinding setting '#{@attrArg}'"
      @safelySetProps({className})
    @descriptor