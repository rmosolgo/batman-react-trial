class Batman.DOM.React.Descriptor extends Batman.Object
  @COUNTER: 0
  @UPDATING: false

  constructor: ({@type, @props, @children, @context}) ->
    # @context is usually added later ...

  @accessor 'toReact', ->
    # context has already been applied -- just pass it to react
    plainObj = @get('toObject')
    @_invokeOnReact(plainObj)


  _invokeOnReact: (item) ->
    if item instanceof Array
      (@_invokeOnReact(member) for member in item)
    else if typeof item in ["string", "number", "boolean", "undefined"] || !item? # hi, null!
      item
    else
      {type, props, children} = item
      children = (@_invokeOnReact(child) for child in children)
      React.DOM[type](props, children...)

  @accessor 'toObject', ->
    # returns {type, props, children} or [children] (foreach)
    plainObj = @performReactTransforms({@type, @props, @children, @context})


  performReactTransforms: (descriptor) ->
    context = descriptor.context
    for key, value of descriptor.props when key.substr(0,5) is "data-"
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
      # if bindingName in ["showif", "hideif"]
      #   console.log "props after #{bindingName}: #{JSON.stringify(descriptor.props)}"

    # don't forget, descriptor from foreach is an array!
    if descriptor.context? && descriptor.context isnt context
      context = descriptor.context
    # descriptor started as a pojo, and should now be a pojo or array of pojos
    @_handleTransformedDescriptor(descriptor, context)

  _handleTransformedDescriptor: (descriptor, context) ->
    if descriptor instanceof Array
      (@_handleTransformedDescriptor(child, context) for child in descriptor)
    else if descriptor instanceof Batman.DOM.React.Descriptor
      descriptor.context ||= context
      descriptor.get('toObject')
    else if typeof descriptor in ["string", "number", "boolean", "undefined"] || !descriptor? # hi, null!
      descriptor
    else
      descriptor.children = for child in descriptor.children
        child.context = context
        @_handleTransformedDescriptor(child, context)
      descriptor
