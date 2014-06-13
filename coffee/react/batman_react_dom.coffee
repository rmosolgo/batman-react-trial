


safelySetProps = (tagObject, props) ->
  if tagObject.isMounted()
    tagObject.setProps(props)
  else
    Batman.mixin(tagObject.props, props)

Batman.DOM.React ||= {}
Batman.DOM.React.TAG_NAME_MAPPING = {
  ReactDOMButton: "button"
  ReactDOMInput: "input"
  ReactDOMOption: "option"
  ReactDOMForm: "form"
}

cloneComponent = (component, extraProps={}) ->
  return unless component?
  componentType = Batman.typeOf(component)
  switch
    when componentType is "String"
      component
    when componentType is "Array"
      (cloneComponent(cpt) for cpt in component)
    when tagName = component.constructor.displayName
      originalTagName = tagName
      tagName = Batman.DOM.React.TAG_NAME_MAPPING[tagName] || tagName
      newProps = Batman.mixin({"data-clone" : true }, component.props, extraProps)
      # reactDebug "Mixed in, got ", extraProps, newProps
      children = cloneComponent(component.props.children)
      constructor = component.BatmanConstructor || Batman.DOM[tagName]
      cpt = constructor(newProps, children)
      if tagName is "p"
        console.log "p is owned by #{cpt._owner.constructor.displayName}"
      cpt
    else
      debugger
      console.warn("cloneComponent failed: No tagName for ", component)


Batman.DOM.reactReaders =
  bind: Batman.DOM.React.BindBinding
  route: Batman.DOM.React.RouteBinding
  showif: Batman.DOM.React.ShowIfBinding
  hideif: Batman.DOM.React.HideIfBinding

  # TODO: add data-route-params
  # context: (definition) ->
  # view: (definition) ->
  # partial: (definition) ->
  # contentfor: (definition) ->
  # yield: (definition) ->

  ## WONTFIX:
  target: Batman.DOM.React.BindBinding
  source: Batman.DOM.React.BindBinding
  ## WONT IMPLEMENT:
  defineview: Batman.DOM.React.NotImplementedBinding
  insertif: Batman.DOM.React.NotImplementedBinding
  removeif: Batman.DOM.React.NotImplementedBinding
  deferif: Batman.DOM.React.NotImplementedBinding
  renderif: Batman.DOM.React.NotImplementedBinding

Batman.DOM.reactAttrReaders =
  foreach: Batman.DOM.React.ForEachBinding
  event: Batman.DOM.React.EventBinding
  bind: Batman.DOM.React.BindAttributeBinding
  addclass: Batman.DOM.React.AddClassBinding
  removeclass: Batman.DOM.React.RemoveClassBinding
  context: Batman.DOM.React.ContextAttributeBinding
  # track: (definition) ->
  # formfor: Batman.DOM.React.NotImplementedBinding
  # style: (definition) ->

  ## WONTFIX:
  source: Batman.DOM.React.BindAttributeBinding


for tagName, tagFunc of React.DOM
  do (tagName, tagFunc) ->
    Batman.DOM[tagName] = (props, children...) ->
      # you can use `class=` with Batman.DOM
      if classes = props?.class
        props.className = classes
        delete props.class

      tagObject = tagFunc.call(React.DOM, props, children...)
      tagObject.BatmanConstructor = Batman.DOM[tagName]
      for key, value of props when key.substr(0,5) is "data-"

        keyParts = key.split("-")
        bindingName = keyParts[1]

        if bindingName is "clone"
          continue

        if keyParts.length > 2
          attrArg = keyParts.slice(2).join("-") # allows data-addclass-alert--error
        else # have to unset since this isn't in a closure
          attrArg = undefined

        # console.log "#{key}=#{value}", bindingName, attrArg
        if attrArg?
          bindingClass = Batman.DOM.reactAttrReaders[bindingName]
        else
          bindingClass = Batman.DOM.reactReaders[bindingName]

        if !bindingClass
          console.warn("No binding found for #{key}=#{value} on #{tagName}")
        else
          tagObject = new bindingClass(tagObject, bindingName, value, attrArg).applyBinding()

        if bindingName is "foreach"
          break

      tagObject


