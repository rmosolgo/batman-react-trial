class Batman.DOM.React.ShowIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @_showIf(@filteredValue)
    @descriptor

  _showIf: (shouldShow) ->
    style = @descriptor.props.style || {}
    if shouldShow
      console.log("Showing #{@descriptor.type} #{@descriptor.children} for #{@keypath}")# in the context of a foreach binding, it could inherit a failed test from the prototype node
      delete style.display
    else
      console.log("Hiding #{@descriptor.type} #{@descriptor.children} for #{@keypath}")
      style.display = 'none !important'
    @descriptor.props.style = style