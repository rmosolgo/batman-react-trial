class Batman.DOM.React.RouteBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    path = if @filteredValue instanceof Batman.NamedRouteQuery
        @filteredValue.get('path')
      else
        @filteredValue
    onClick = (e) ->
      e.stopPropagation()
      Batman.redirect(path)
    href = Batman.navigator.linkTo(path)
    @safelySetProps({onClick, href})
    @tagObject