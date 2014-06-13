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
  # style: (definition) ->

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
      # bindBatmanDescriptor will add context
      descriptor = {
        type: tagName
        props
        children
      }


