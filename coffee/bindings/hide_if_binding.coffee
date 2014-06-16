class Batman.DOM.React.HideIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    Batman.DOM.React.ShowIfBinding::_showIf.call(@, !@filteredValue)
    @descriptor