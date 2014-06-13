class Batman.DOM.React.HideIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    contentValue = @filteredValue
    Batman.DOM.React.ShowIfBinding::_showIf.call(@, !contentValue)
    @tagObject