class Batman.DOM.React.ForEachBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    _getKey = @_getEnumerateKey
    _removeBinding = @_removeForEachBinding.bind(@)
    itemName = @attrArg
    collectionName = @keypath
    collection = @filteredValue
    return [] if !collection
    {type, children, props, context} = @descriptor

    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0])

    if collection?.toArray
      collection = collection.toArray()

    newDescriptors = []
    Batman.forEach collection, (item) ->
      key = _getKey(item)
      injectedContext = context.injectContext(itemName, item)
      newProps = Batman.mixin({}, props, {key})
      _removeBinding(newProps)
      descriptor = new Batman.DOM.React.Descriptor({
        type
        children: cloneDescriptor(children, injectedContext)
        props: newProps
        context: injectedContext
      })
      newDescriptors.push(descriptor)
    newDescriptors

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)

  _removeForEachBinding: (props) ->
    forEachProp = {}
    forEachProp["data-foreach-#{@attrArg}"] = true
    Batman.unmixin(props, forEachProp)

cloneDescriptor = (descriptor, ctx) ->
  # console.log "cloning", descriptor
  if descriptor instanceof Array
    (cloneDescriptor(item) for item in descriptor)
  else if descriptor instanceof Batman.DOM.React.Descriptor
      newDescriptor = new Batman.DOM.React.Descriptor({
        type: descriptor.type
        props: Batman.mixin({}, descriptor.props)
        children: cloneDescriptor(descriptor.children, ctx)
        context: ctx
      })
  else
    descriptor
