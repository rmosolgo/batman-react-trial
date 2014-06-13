class Batman.DOM.React.AddClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @tagObject.props.className || ""
      className += " #{@attrArg}"
      # reactDebug "AddClassBinding setting '#{@attrArg}'"
      @safelySetProps({className})
    else if @tagObject.props['data-clone']
      # could have been falsely done by the prototype component
      @filteredValue = !@filteredValue
      Batman.DOM.React.RemoveClassBinding::applyBinding.apply(@)

    @tagObject