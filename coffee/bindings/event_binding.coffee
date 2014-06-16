class Batman.DOM.React.EventBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    handler = @filteredValue

    eventHandlers = {}
    eventHandlers["on#{Batman.helpers.camelize(@attrArg)}"] = (e) =>
      e.preventDefault()
      handler()
    @safelySetProps(eventHandlers)
    @descriptor

  getUnfilteredValue: ->
    base = @descriptor.context.baseForKeypath(@key)
    terminal = new Batman.Keypath(base, @key).terminalProperty()
    @unfilteredValue = terminal.getValue().bind(terminal.base)