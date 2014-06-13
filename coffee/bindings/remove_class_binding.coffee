class Batman.DOM.React.RemoveClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @tagObject.props.className || ""
      className = className.replace("#{@attrArg}", "")
      # reactDebug "RemoveClassBinding removing #{@attrArg}"
      @safelySetProps({className})
    else if @tagObject.props['data-clone']
      # could have been falsely done by the prototype component
      @filteredValue = !@filteredValue
      Batman.DOM.React.AddClassBinding::applyBinding.apply(@)
    @tagObject