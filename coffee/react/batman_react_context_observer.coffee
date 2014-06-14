class Batman.ContextObserver extends Batman.Hash
  @COUNT = 0
  constructor: ({@component, @target}) ->
    super({})
    @constructor.COUNT += 1
    @_logCount()
    @_alreadyObserving = {}
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
    return if prop in @_properties
    @_properties.push(prop)
    prop.observe(@forceUpdate)
    prop.observe (nv, ov) -> reactDebug "forceUpdate because of #{prop.key} #{Batman.Filters.truncate(JSON.stringify(ov), 15)} -> #{Batman.Filters.truncate(JSON.stringify(nv), 15)}"

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
    @constructor.COUNT -= 1
    @_logCount()
    @forEach (keypathName, property) =>
      # reactDebug "ContextObserver forgetting #{keypathName}"
      property?.forget(@forceUpdate)
      @forget(keypathName)
      @unset(keypathName)
    @off()

  _logCount: ->
    return if @_logging
    @_logging = Batman.setImmediate =>
      console.log("#{@constructor.COUNT} ContextObservers")
      @_logging = false
