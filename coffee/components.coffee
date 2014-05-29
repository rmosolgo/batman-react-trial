Batman.ReactMixin =
  getInitialState: ->
    @_observeContext()
    return {}
  willReceiveProps: (nextProps) ->
    @_observeContext(nextProps)

  componentWillUnmount: ->
    @_observer.die()

  updateKeypath: (keypath) ->
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      console.log "updating " + keypath + " to: ", value
      @_observer.setContext keypath, value

  sourceKeypath: (keypath) ->
    @_observer.getContext keypath

  _observeContext: (props) ->
    props ||= @props
    target = props.target or props.controller
    console.log "Observing context with target", target
    @_observer.die() if @_observer
    @_observer = new Batman.ContextObserver(target: target, component: this)

  executeAction: (actionName, params) ->
    (e) =>
      e.preventDefault()
      actionParams = params or e
      @props.controller.executeAction(actionName, actionParams)

  handleWith: (handlerName, withArguments...) ->
    (e) =>
      e.preventDefault()
      callArgs = withArguments or [e]
      @props.controller[handlerName].apply @props.controller, callArgs

  enumerate: (setName, itemName, generator) ->
    set = @sourceKeypath(setName)
    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName)
    render = -> generator.call this, @props.item
    iterationComponent = Batman.createComponent({render, displayName})
    outerContext = @_observer.get("context")
    controller = @props.controller
    components = set.map (item) ->
      innerContext = Batman.extend({}, outerContext)
      innerContext[itemName] = item
      console.log "innerContext", innerContext
      target = new Batman.Hash(innerContext)
      innerProps = {controller, target, item}
      iterationComponent innerProps
    components

  linkTo: (routeQuery) ->
    if routeQuery.substr(0, 6) isnt 'routes'
      path = routeQuery
    else
      parts = routeQuery.split(/\[/)
      base = Batman.currentApp
      for part in parts
        if part.indexOf(']') > -1
          obj = @sourceKeypath(part.replace(/\]/, ''))
          base = base.get(obj)
        else
          base = base.get(part)
      path = base.get('path')
    console.log "#{routeQuery} became #{path}"
    Batman.navigator.linkTo(path)


Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  React.createClass options