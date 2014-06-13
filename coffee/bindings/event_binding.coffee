class Batman.DOM.React.EventBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    handler = @filteredValue
    eventHandlers = {}
    eventHandlers["on#{Batman.helpers.camelize(@attrArg)}"] = (e) ->
      e.preventDefault()
      handler.apply(@, arguments)
    @safelySetProps(eventHandlers)
    @descriptor


  # _unfilteredValue: (key) ->
  #   @unfilteredKey = key
  #   if not @functionName and (index = key.lastIndexOf('.')) != -1
  #     @functionPath = key.substr(0, index)
  #     @functionName = key.substr(index + 1)

  #   value = super(@functionPath || key)
  #   if @functionName
  #     value?[@functionName]
  #   else
  #     value
