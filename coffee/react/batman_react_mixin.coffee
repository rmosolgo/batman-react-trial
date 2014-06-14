
Batman.ReactMixin =
  getInitialState: ->
    @_observeContext()
    return {}
  willReceiveProps: (nextProps) ->
    @_observeContext(nextProps)

  componentWillUnmount: ->
    @_observer.die()

  _observeContext: (props) ->
    props ||= @props
    if props.contextObserver
      @_observer?.die()
      @_observer = props.contextObserver
    else
      target = props.contextTarget || new Batman.Object
      @_observer.die() if @_observer
      @_observer = new Batman.ContextObserver(target: target, component: this)

  renderTree: ->
    tree = @renderBatman()
    tree.contextObserver = @_observer
    components = bindBatmanDescriptor(tree)
    components

bindBatmanDescriptor = (descriptor = {}) ->
  descriptorType = Batman.typeOf(descriptor)
  return descriptor if descriptorType is "String"

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
      console.warn("No binding found for #{key}=#{value} on #{descriptor.type}")
    else
      descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()
      # foreach binding returns an array of children!
      if bindingName is "foreach"
        break

  if descriptor?.type
    {type, props, children} = descriptor
    newChildren = for child in children
      if descriptor.props?.injectedContext && child.type
        child.props ||= {}
        child.props.injectedContext = descriptor.props.injectedContext
      child.contextObserver ?= descriptor.contextObserver
      bindBatmanDescriptor(child)
    React.DOM[type](props, newChildren...)
  else
    descriptor

Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  options.render = Batman.ReactMixin.renderTree
  React.createClass options