CONTEXT_DEBUG = false
contextDebug = ->
  if CONTEXT_DEBUG
    console.log(arguments...)

Batman.DOM.React.ContextMixin =
  initialize: ->
    @injectContextAttribute = (key, value) ->
      @_prepareProxies()
      @_proxies.forKey(key).getOrSet value, =>
        proxy = new Batman.DOM.React.ContextAttributeProxy(@)
        proxy.accessor key, ->
          value
        proxy

    @injectContextTarget = (object) ->
      @_prepareProxies()
      @_proxies.getOrSet object, =>
        proxy = new Batman.DOM.React.ContextTargetProxy(@)
        proxy._context = object
        proxy

    @_prepareProxies = ->
      @_proxies ||= new Batman.DOM.React.ContextProxyHash

class Batman.DOM.React.Context extends Batman.Object
  constructor: ({@component, @controller}) ->
    super({})
    @componentName = @component?.constructor?.displayName
    @_storage = new Batman.Hash
    @_targets = [@controller, Batman.currentApp]
    contextDebug "CONTEXT created #{@get('_batmanID')}"

  @mixin(Batman.DOM.React.ContextMixin)
  @accessor
    get: (key) ->
      base = @baseForKeypath(key)
      value = base?.get(key)
    set: (key, value) ->
      base = @baseForKeypath(key)
      base?.set(key, value)


  baseForKeypath: (keypath) ->
    contextDebug("CONTEXT lookup #{@get("_batmanID")} #{keypath} #{@constructor.name}")
    parts = keypath.split(".")
    firstPart = parts.shift()
    base = @_findBase(firstPart)

  _findBase: (firstPart) ->
    for target in @_targets
      if typeof target.get(firstPart) isnt "undefined"
        return target
    return @_storage

  die: ->
    if @isDead
      console.warn "Trying to kill and already-dead #{@constructor.name}"
      return
    contextDebug("CONTEXT dying  #{@get('_batmanID')}")

    @_batman.properties?.forEach (key, property) -> property.die()
    if @_batman.events
      event.clearHandlers() for _, event of @_batman.events
    # @_batman = null
    @_storage = null
    @_proxies = null
    @controller = null
    @component = null
    @_targets = null
    @_findBase = ->
    @isDead = true
    @fire('die')

class Batman.DOM.React.ContextProxy extends Batman.Proxy
  constructor: ->
    super
    contextDebug("CONTEXT PROXY created #{@get("_batmanID")} #{@constructor.name}")
    @target.on 'die', @die.bind(@)
    @componentName = @target.componentName

  @mixin(Batman.DOM.React.ContextMixin)

  baseForKeypath: (keypath) ->
    contextDebug("CONTEXT PROXY lookup #{@get("_batmanID")} #{keypath} #{@constructor.name}")
    @target.baseForKeypath(keypath)

  die: ->
    @_batman.properties?.forEach (key, property) -> property.die()
    if @_batman.events
      event.clearHandlers() for _, event of @_batman.events
    # @_batman = null
    contextDebug("CONTEXT PROXY dying #{@get("_batmanID")} #{@constructor.name}")
    @isDead = true
    @target.die()

class Batman.DOM.React.ContextAttributeProxy extends Batman.DOM.React.ContextProxy


class Batman.DOM.React.ContextTargetProxy extends Batman.DOM.React.ContextProxy
  @wrapAccessor (core) ->
    get: (key) ->
      parts = key.split(".")
      firstPart = parts.shift()
      if obj = Batman.get(@_context, firstPart)
        Batman.get(@_context, key)
      else
        core.get.call(@target, key)

  die: ->
    super
    @_targets = null


class Batman.DOM.React.ContextProxyHash extends Batman.Hash
  forKey: (key) ->
    @getOrSet key, => new @constructor
