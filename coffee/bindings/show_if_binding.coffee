class Batman.DOM.React.ShowIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @_showIf(@filteredValue)
    @descriptor

  _showIf: (shouldShow) ->
    style = @descriptor.props.style || {}
    if shouldShow
      delete style.display
    else
      style.display = 'none !important'
    @descriptor.props.style = style