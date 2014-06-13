
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
      reactDebug "updating " + keypath + " to: ", value
      @_observer.setContext keypath, value

  sourceKeypath: (keypath) ->
    if !keypath # or keypath is 'animalclass'
      debugger
    val = @_observer.getContext(keypath)
    val


  setContext: (key, value) ->
    @_observer.setContext(key, value)

  _observeContext: (props) ->
    props ||= @props
    target = props.contextTarget || props.controller
    reactDebug "observing contextTarget", target
    @_observer.die() if @_observer
    @_observer = new Batman.ContextObserver(target: target, component: this)

  enumerate: (setName, itemName, generator) ->
    _getKey = @_getEnumerateKey
    set = @sourceKeypath(setName)
    @sourceKeypath("#{setName}.toArray")
    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName.split(".")[0])
    render = ->
      generator.call(this)
    iterationComponent = Batman.createComponent({render, displayName})

    # only pass base objects to the child so that nested keypaths will be looked up against it
    baseContext = @_observer.get('baseContext')
    delete baseContext[itemName]

    # reactDebug "baseContext", baseContext
    controller = @props.controller
    components = set.map (item) ->
      innerContext = Batman.extend({}, baseContext)
      innerContext[itemName] = item
      contextTarget = new Batman.Object(innerContext)
      key = _getKey(item)
      innerProps = {controller, contextTarget, item, key}
      cpt = iterationComponent(innerProps)
      cpt._owner = cpt
      cpt
    components

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)
