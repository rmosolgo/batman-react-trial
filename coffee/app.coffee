Batman.Controller::renderReact = (options={}) ->
  if frame = @_actionFrames?[@_actionFrames.length - 1]
    frame.startOperation()

  # Ensure the frame is marked as having had an action executed so that render false prevents the implicit render.
  if options is false
    frame.finishOperation()
    return

  action = frame?.action || @get('action')
  yieldName = options.into || "main"
  targetYield = Batman.DOM.Yield.withName(yieldName)
  yieldNode = targetYield.containerNode

  componentName = Batman.helpers.camelize("#{@get('routingKey')}_#{action}_component")
  componentClass = Batman.currentApp[componentName]
  if !componentClass
    throw "No component for #{componentName}!"
  component = componentClass(controller: @)
  if existingComponent = targetYield.get('component')
    console.log("existing component", existingComponent)
    React.unmountComponentAtNode(yieldNode)
  targetYield.set('component', component)
  React.renderComponent(component, yieldNode)
  console.log "rendered", componentName
  frame?.finishOperation()


Batman.config.pathToApp = window.location.pathname
Batman.config.usePushState = false
class @App extends Batman.App
  @root 'animals#index'
  @resources 'animals'

  @syncsWithFirebase 'batman-react'

  @on 'run', ->
    App.Animal.load()
    setTimeout =>
        @_seedData()
      , 2000
    Batman.redirect("/")

  # Just to make things interesting, make some Animals
  @_seedData: ->
    totalAnimals = App.Animal.get('all.length')
    if totalAnimals is 0
      for n in ["Hedgehog", "Starfish", "Echidna"]
        animal = new App.Animal(name: n)
        animal.save()

$ -> App.run()

class Batman.ContextObserver extends Batman.Hash
  constructor: ({@component, @target}) ->
      super({})
      @forceUpdate = @_forceUpdate.bind(@)
      @on "changed", @forceUpdate

  _forceUpdate: ->
    if @component.isMounted()
      @component.forceUpdate()
    else
      console.log "Wasn't mounted", @component

  _property: (keypath) ->
    property = @getOrSet keypath, =>
      prop = new Batman.Keypath(@target, keypath).terminalProperty() || new Batman.Keypath(Batman.currentApp, keypath).terminalProperty()
      # console.log keypath, prop?.base, prop?.key
      if !prop?
        console.warn "#{keypath} wasn’t found in context for", @target
      else
        prop.observe =>
          console.log "forceUpdate because of #{keypath}"
          @forceUpdate()
        # console.log keypath, 'found', prop.getValue()
      prop
    property

  getContext: (keypath) -> @_property(keypath)?.getValue()
  setContext: (keypath, value) -> @_property(keypath).setValue(value)
  @accessor 'context', ->
    ctx = {}
    @forEach (key, value) =>
      ctx[key] = @getContext(key)
    ctx

  die: ->
    @forEach (keypathName, property) =>
      console.log "ContextObserver forgetting #{keypathName}"
      property.forget @forceUpdate
      @unset(keypathName)
    @off()
    @forget()
