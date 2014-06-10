# Batman.Controller::renderReact
# Batman.ContextObserver
# Batman.ReactMixin
# Batman.createComponent

@BatmanReactDebug = false
@reactDebug = ->
  if BatmanReactDebug
    console.log(arguments...)

Batman.Controller::renderReact = (options={}) ->
  if frame = @_actionFrames?[@_actionFrames.length - 1]
    frame.startOperation()

  # Ensure the frame is marked as having had an action executed so that render false prevents the implicit render.
  if options is false
    frame.finishOperation()
    return

  yieldName = options.into || "main"
  targetYield = Batman.DOM.Yield.withName(yieldName)

  yieldNode = targetYield.containerNode

  # look up the component by name
  action = frame?.action || @get('action')
  componentName = Batman.helpers.camelize("#{@get('routingKey')}_#{action}_component")
  componentClass = Batman.currentApp[componentName]
  if !componentClass
    throw "No component for #{componentName}!"

  # instantiate and render the component (cleaning up an existing one)
  component = componentClass(controller: @)
  if existingComponent = targetYield.get('component')
    reactDebug("existing component", existingComponent)
    React.unmountComponentAtNode(yieldNode)
  targetYield.set('component', component)

  # clean up an existing view if there is one
  if view = targetYield.get('contentView')
    view.die()
    targetYield.unset('contentView')

  # if a batman.view gets rendered here, remove the component
  targetYield.observeOnce 'contentView', (nv, ov) ->
    if nv?
      React.unmountComponentAtNode(@containerNode)

  React.renderComponent(component, yieldNode)
  reactDebug "rendered", componentName
  frame?.finishOperation()


class Batman.ContextObserver extends Batman.Hash
  constructor: ({@component, @target}) ->
      super({})
      @forceUpdate = @_forceUpdate.bind(@)
      @on "changed", @forceUpdate

  _targets: ->
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
    base = @_baseForKeypath(keypath)
    prop = base.property(keypath)
    @set(keypath, prop)
    prop.observe(@forceUpdate)
    reactDebug("Observing #{prop.key} on", prop.base)
    prop.observe ->
      reactDebug "forceUpdate because of #{prop.key}"

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
    Batman.Property.forBaseAndKey(base, keypath)?.setValue(value)

  @accessor 'context', ->
    ctx = {}
    @forEach (key, value) =>
      ctx[key] = @getContext(key)
    ctx

  die: ->
    @forEach (keypathName, property) =>
      reactDebug "ContextObserver forgetting #{keypathName}"
      property?.forget(@forceUpdate)
      @unset(keypathName)
    @off()
    @forget()

Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  React.createClass options