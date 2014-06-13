class Batman.ContextObserver extends Batman.Hash
  constructor: ({@component, @target}) ->
      super({})
      @_alreadyObserving = {}
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

  _observeKeypath: (keypath) ->
    return if @_alreadyObserving[keypath]
    @_alreadyObserving[keypath] = true
    base = @_baseForKeypath(keypath)
    prop = base.property(keypath)
    @set(keypath, prop)
    prop.observe(@forceUpdate)
    # reactDebug("Observing #{prop.key} on", prop.base)
    prop.observe (nv, ov) -> reactDebug "forceUpdate because of #{prop.key} #{Batman.Filters.truncate(JSON.stringify(ov), 15)} -> #{Batman.Filters.truncate(JSON.stringify(nv), 15)}"

  getContext: (keypath) ->
    base = @_baseForKeypath(keypath)
    if !base
      console.warn("Nothing found for #{keypath}")
      return
    prop = Batman.Property.forBaseAndKey(base, keypath)
    @_observeKeypath(keypath) if prop?

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
      @target.set(keypath, value)
      @_observeKeypath(keypath)

  @accessor 'context', ->
    ctx = {}
    @forEach (key, value) =>
      ctx[key] = @getContext(key)
    ctx

  @accessor 'baseContext', ->
    ctx = {}
    @forEach (key, value) =>
      baseKey = key.split(".")[0]
      if !ctx[baseKey]
        # reactDebug "Adding #{baseKey} to baseContext (#{itemName})"
        ctx[baseKey] = @getContext(baseKey)
    ctx

  die: ->
    @forEach (keypathName, property) =>
      # reactDebug "ContextObserver forgetting #{keypathName}"
      property?.forget(@forceUpdate)
      @forget(keypathName)
      @unset(keypathName)
    @off()
