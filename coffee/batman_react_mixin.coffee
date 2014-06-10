
Batman.ReactMixin =
  getInitialState: ->
    @_observeContext()
    return {}
  willReceiveProps: (nextProps) ->
    @_observeContext(nextProps)

  componentWillUnmount: ->
    @_observer.die()

  _contextualize: (keypath) ->
    return keypath unless @dataContext?
    parts =  keypath.split(/\./)
    firstPart = parts.shift()
    contextualizedFirstPart = @dataContext[firstPart] || firstPart
    parts.unshift(contextualizedFirstPart)
    parts.join(".")

  updateKeypath: (keypath) ->
    keypath = @_contextualize(keypath)
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      reactDebug "updating " + keypath + " to: ", value
      @_observer.setContext keypath, value

  sourceKeypath: (keypath) ->
    @_observer.getContext(@_contextualize(keypath))

  _observeContext: (props) ->
    props ||= @props
    target = props.target || props.controller
    reactDebug "Observing context with target", target
    @_observer.die() if @_observer
    @_observer = new Batman.ContextObserver(target: target, component: this)

  executeAction: (actionName, params) ->
    (e) =>
      e.preventDefault()
      actionParams = params or e
      @props.controller.executeAction(actionName, actionParams)

  handleWith: (handlerName, withArguments...) ->
    handler = @sourceKeypath(handlerName)
    (e) =>
      e.preventDefault()
      callArgs = withArguments or [e]
      handler(callArgs...)

  enumerate: (setName, itemName, generator) ->
    _getKey = @_getEnumerateKey
    set = @sourceKeypath(setName)
    @sourceKeypath("#{setName}.toArray")
    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName.split(".")[0])
    render = ->
      generator.call(this, @props.item)
    iterationComponent = Batman.createComponent({render, displayName})
    outerContext = @_observer.get("context")
    controller = @props.controller
    components = set.map (item) ->
      innerContext = Batman.extend({}, outerContext)
      innerContext[itemName] = item
      target = new Batman.Object(innerContext)
      key = _getKey(item)
      innerProps = {controller, target, item, key}
      iterationComponent(innerProps)
    components

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)

  linkTo: (routeQuery) ->
    if routeQuery.substr(0, 6) isnt 'routes'
      path = routeQuery
    else
      parts = routeQuery.split(/\[/)
      base = Batman.currentApp
      for part in parts
        # TODO: Allow routes.people[membership.person].edit
        if part.indexOf(']') > -1
          [objPart, actionPart] = part.split(/\]\./)
          obj = @sourceKeypath(objPart)
          base = base.get(obj)
          base = base.get(actionPart)
        else
          base = base.get(part)
      path = base.get('path')
    Batman.navigator.linkTo(path)

  redirect: (routeQuery) ->
    path = @linkTo(routeQuery)
    (e) ->
      e.stopPropagation()
      Batman.redirect(path)

  addClass: (className, keypath, renderFunc) ->
    val = @sourceKeypath(keypath)
    node = renderFunc()
    if val
      node.className += " #{className}"
    node

  _showIf: (val, callback) ->
    if val
      callback.call(@)
    else
      undefined

  showIf: (keypaths..., callback) ->
    val = true
    for keypath in keypaths
      val = val and @sourceKeypath(keypath)
      if !val
        return @_showIf(!!val, callback)
    @_showIf(!!val, callback)

  hideIf: (keypaths..., callback) ->
    val = true
    for keypath in keypaths
      val = val and @sourceKeypath(keypath)
      if !val
        return @_showIf(!val, callback)
    @_showIf(!val, callback)
