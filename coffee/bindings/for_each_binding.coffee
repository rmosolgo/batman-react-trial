class Batman.DOM.React.ForEachBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    _getKey = @_getEnumerateKey
    itemName = @attrArg
    collectionName = @keypath
    collection = @filteredValue
    {type, children, props, contextObserver} = @descriptor
    forEachProp = {}
    forEachProp["data-foreach-#{itemName}"] = true
    Batman.unmixin(props, forEachProp)

    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0])
    component = contextObserver.component

    if collection?.toArray
      collection = @lookupKeypath("#{@keypath}.toArray")

    list = for item in collection
      key = _getKey(item)
      injectedContext = Batman.mixin({}, props.injectedContext)
      injectedContext[itemName] = item
      newProps = Batman.mixin({key, injectedContext}, props)
      console.log "ic", injectedContext
      descriptor = {
        type
        children: cloneDescriptor(children)
        props: newProps
        contextObserver
      }
      # reactDebug "#{type} for #{itemName} #{item?.get?('name')} => #{JSON.stringify(newProps)} #{contextObserver.get('_batmanID')}", descriptor
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
