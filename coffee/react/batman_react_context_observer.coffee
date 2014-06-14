class Batman.ContextObserver extends Batman.Hash
  @COUNT = 0
  constructor: ({@component, @target}) ->
    super({})
    @constructor.COUNT += 1
    @_logCount()
    @_properties = []
    @forceUpdate = @_forceUpdate.bind(@)
    @on "changed", @forceUpdate

  _targets: ->
    @_targetArray ||= if @component?.props?.controller
        [@target, @component.props.controller, Batman.currentApp]
      else
        [@target, Batman.currentApp]

  _forceUpdate: ->
    if @component.isMounted()
      @component.forceUpdate()
    else
      reactDebug "Wasn't mounted", @component

  _baseForKeypath: (keypath) ->
    segmentPath = ""
    for segment in keypath.split(".")
      segmentPath += segment
      for target in @_targets()
        if typeof target.get(segmentPath) isnt "undefined"
          return target
    undefined

  observeProperty: (prop) ->
    @_logProperties ||= Batman.setImmediate =>
      if @DEAD
        console.log("Observer was killed")
      else
        console.log("Now tracking #{@_properties.length} properties")
      @_logProperties = false
    return false if prop in @_properties
    @_properties.push(prop)
    prop.observe(@forceUpdate)
    prop.observe (nv, ov) -> reactDebug "forceUpdate because of #{prop.key} #{Batman.Filters.truncate(JSON.stringify(ov), 15)} -> #{Batman.Filters.truncate(JSON.stringify(nv), 15)}"
    return true

  getContext: (keypath) ->
    base = @_baseForKeypath(keypath)
    if !base
      # console.warn("Nothing found for #{keypath}")
      return
    prop = Batman.Property.forBaseAndKey(base, keypath)
    @observeProperty(prop) if prop?

    value = prop?.getValue()
    # for example, if you look up a function relative to currentApp, `this` is gonna get all messed up when you call it again.
    if Batman.typeOf(value) is "Function"
      terminal = new Batman.Keypath(base, keypath).terminalProperty()
      value = value.bind(terminal.base)
    value

  setContext: (keypath, value) ->
    base = @_baseForKeypath(keypath)
    if base?
      Batman.Property.forBaseAndKey(base, keypath)?.setValue(value)
    else if typeof value isnt "undefined"
      base = @target
      base.set(keypath, value)
    prop = Batman.Property.forBaseAndKey(base, keypath)
    @observeProperty(prop)
    value

  die: ->
    if @DEAD
      console.warn("This context observer was already killed!")
      return
    @DEAD = true
    @constructor.COUNT -= 1
    @_logCount()
    for property in @_properties
      property?.forget(@forceUpdate)

    @_properties = null
    @off()

  _logCount: ->
    return if @constructor._logging
    @constructor._logging = Batman.setImmediate =>
      console.log("#{@constructor.COUNT} ContextObservers")
      @constructor._logging = false
