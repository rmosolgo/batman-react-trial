class Batman.DOM.React.ForEachBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    _getKey = @_getEnumerateKey
    itemName = @attrArg
    collectionName = @keypath
    collection = @filteredValue
    {type, children, props} = @descriptor
    forEachProp = {}
    forEachProp["data-foreach-#{itemName}"] = true
    Batman.unmixin(props, forEachProp)

    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0])

    # only pass base objects to the child so that nested keypaths will be looked up against it
    baseContext = @descriptor.contextObserver.get('baseContext')
    delete baseContext[itemName]

    component = @descriptor.contextObserver.component

    if collection?.toArray
      collection = @lookupKeypath("#{@keypath}.toArray")

    list = for item in collection
      innerContext = Batman.extend({}, baseContext)
      key = _getKey(item)
      innerContext[itemName] = item
      # TODO: How can i not instantiate batman objects here??
      contextTarget = new Batman.Object(innerContext)
      contextObserver = new Batman.ContextObserver(target: contextTarget, component: component)
      newProps = Batman.mixin({item, key}, props)
      descriptor = {
        type
        children: cloneDescriptor(children)
        props: newProps
        contextObserver
      }
      # reactDebug "#{type} for #{itemName} #{item.get('name')} => #{JSON.stringify(newProps)} #{contextObserver.get('_batmanID')}", descriptor
      bindBatmanDescriptor(descriptor)
    list

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)

cloneDescriptor = (descriptor, ctx) ->
  argType = Batman.typeOf(descriptor)
  switch argType
    when "Array"
      (cloneDescriptor(item) for item in descriptor)
    when "Object"
      newDescriptor = {}
      for key, value of descriptor
        if key in ["contextObserver"]
          continue
        else
          newDescriptor[key] = cloneDescriptor(value)
      newDescriptor
    else
      descriptor
