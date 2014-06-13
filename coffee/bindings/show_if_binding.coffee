class Batman.DOM.React.ShowIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    contentValue = @filteredValue
    @_showIf(!!contentValue)
    @descriptor

  _showIf: (trueOrFalse) ->
    style = Batman.mixin({}, @descriptor.props.style || {})
    if !trueOrFalse
      style.display = 'none !important'
    else
      delete style.display # in the context of a foreach binding, it could inherit a failed test from the prototype node
    @safelySetProps({style})