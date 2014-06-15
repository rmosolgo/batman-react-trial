class Batman.DOM.React.Context extends Batman.Object
  constructor: ({@component, @controller}) ->
    @_storage = new Batman.Hash
    @_targets = [@controller, Batman.currentApp]

  # default accessor:
  #   - try to find it
  #   - otherwise set it on @_storage
  @accessor
    get: (key) ->
      parts = key.split(".")
      firstPart = parts.shift()
      base = @_findBase(firstPart)
      value = base.get(key)
      if Batman.typeOf(value) is "Function"
        terminal = new Batman.Keypath(base, key).terminalProperty()
        value = value.bind(terminal.base)
      value
    set: (key, value) ->
      parts = key.split(".")
      firstPart = parts.shift()
      base = @_findBase(firstPart)
      base.set(key, value)

  forceUpdate: ->
    if !@constructor._UPDATING
      @constructor._UPDATING = true
      @component.forceUpdate =>
        @constructor._UPDATING = false

  injectContext: (key, value) ->
    proxy = new Batman.DOM.React.ContextProxy(@)
    proxy.accessor key, ->
      console.log "found proxied #{key}"
      value
    proxy

  _findBase: (firstPart) ->
    for target in @_targets
      if typeof target.get(firstPart) isnt "undefined"
        console.log "found base #{target.name || target.constructor.name} for #{firstPart}"
        return target
    console.log "falling back to @_storage for #{firstPart}"
    return @_storage

  die: ->
    @_batman = null
    @_storage = null
    @controller = null
    @component = null
    @_targets = null
    @isDead = true

class Batman.DOM.React.ContextProxy extends Batman.Proxy
  injectContext: (key, value) ->
    proxy = new Batman.DOM.React.ContextProxy(@)
    proxy.accessor(key, -> value)
    proxy

  die: ->
    @_batman = null
    @target.die()
