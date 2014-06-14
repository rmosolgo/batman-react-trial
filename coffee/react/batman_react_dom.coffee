Batman.DOM.reactReaders =
  bind: Batman.DOM.React.BindBinding
  route: Batman.DOM.React.RouteBinding
  showif: Batman.DOM.React.ShowIfBinding
  hideif: Batman.DOM.React.HideIfBinding
  partial: Batman.DOM.React.PartialBinding
  context: Batman.DOM.React.ContextBinding
  debug: Batman.DOM.React.DebugBinding

  # TODO: add data-route-params
  # view: (definition) ->
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
  style: Batman.DOM.React.StyleAttributeBinding

  ## WONTFIX:
  formfor: Batman.DOM.React.ContextAttributeBinding
  source: Batman.DOM.React.BindAttributeBinding


for tagName, tagFunc of React.DOM
  do (tagName, tagFunc) ->
    Batman.DOM[tagName] = (props, children...) ->
      # you can use `class=` with Batman.DOM
      if classes = props?.class
        props.className = classes
        delete props.class

      # style can be a string
      if styles = props?.style
        props.style = Batman.DOM.React.StyleAttributeBinding::styleStringToObject(styles)

      # bindBatmanDescriptor will add context
      descriptor = {
        type: tagName
        props
        children
      }


