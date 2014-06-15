class Batman.DOM.React.Descriptor extends Batman.Object
  @COUNTER: 0
  @UPDATING: false

  constructor: ({@type, @props, @children, @context}) ->
    # @context is added later ...

  @accessor 'toReact', ->
    reactDescriptor = @performReactTransforms()
    {type, props, children} = reactDescriptor
    if children?.length
      children = (@_handleTransformedDescriptor(child, @context) for child in children)

    if type?
      React.DOM[type](props, children)
    else
      reactDescriptor


  performReactTransforms:  ->
    descriptor = {@type, @props, @children, @context}

    for key, value of @props when key.substr(0,5) is "data-"
      keyParts = key.split("-")
      bindingName = keyParts[1]

      if keyParts.length > 2
        attrArg = keyParts.slice(2).join("-") # allows data-addclass-alert--error
      else # have to unset since this isn't in a closure
        attrArg = undefined

      if attrArg?
        bindingClass = Batman.DOM.reactAttrReaders[bindingName]
      else
        bindingClass = Batman.DOM.reactReaders[bindingName]

      if !bindingClass
        console.warn("No binding found for #{key}=#{value} on #{@type}")
      else if bindingName is "foreach"
        descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()
        break
      else
        descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()


    @_handleTransformedDescriptor(descriptor, @context)

  _handleTransformedDescriptor: (descriptor, context) ->
    if descriptor instanceof Array
      # debugger
      (@_handleTransformedDescriptor(child, context) for child in descriptor)
    else if descriptor instanceof Batman.DOM.React.Descriptor
      descriptor.context ||= context
      descriptor.get('toReact')
    else
      descriptor