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
      for n in ["Spider", "Starfish", "Echidna"]
        animal = new App.Animal(name: n)
        animal.save()

$ -> App.run()



# Batman.Controller::renderReact
# Batman.ContextObserver
# Batman.ReactMixin
# Batman.createComponent

BatmanReactDebug = true
reactDebug = ->
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
  React.renderComponent(component, yieldNode)
  reactDebug "rendered", componentName
  frame?.finishOperation()


class Batman.ContextObserver extends Batman.Hash
  constructor: ({@component, @target}) ->
      super({})
      @forceUpdate = @_forceUpdate.bind(@)
      @on "changed", @forceUpdate

  _forceUpdate: ->
    if @component.isMounted()
      @component.forceUpdate()
    else
      reactDebug "Wasn't mounted", @component

  _property: (keypath) ->
    property = @getOrSet keypath, =>
      prop = new Batman.Keypath(@target, keypath).terminalProperty() || new Batman.Keypath(Batman.currentApp, keypath).terminalProperty()
      # console.log keypath, prop?.base, prop?.key
      if !prop?
        reactDebug "#{keypath} wasn’t found in context for", @target
      else
        prop.observe =>
          reactDebug "forceUpdate because of #{keypath}"
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
      reactDebug "ContextObserver forgetting #{keypathName}"
      property.forget @forceUpdate
      @unset(keypathName)
    @off()
    @forget()

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
    @_observer.getContext keypath

  _observeContext: (props) ->
    props ||= @props
    target = props.target or props.controller
    reactDebug "Observing context with target", target
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
    _getKey = @_getEnumerateKey
    set = @sourceKeypath(setName)
    @sourceKeypath("#{setName}.toArray")
    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName)
    render = ->
      generator.call this, @props.item
    iterationComponent = Batman.createComponent({render, displayName})
    outerContext = @_observer.get("context")
    controller = @props.controller
    components = set.map (item) ->
      innerContext = Batman.extend({}, outerContext)
      innerContext[itemName] = item
      target = new Batman.Hash(innerContext)
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
        if part.indexOf(']') > -1
          obj = @sourceKeypath(part.replace(/\]/, ''))
          base = base.get(obj)
        else
          base = base.get(part)
      path = base.get('path')
    Batman.navigator.linkTo(path)


Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  React.createClass options
class App.ApplicationController extends Batman.Controller
  openDialog: ->
    $('.modal').modal('show')

  closeDialog: ->
    $('.modal').modal('hide')
    modalYield = Batman.DOM.Yield.get('yields.modal')
    modalYield.get('contentView')?.die()
    modalYield.set('contentView', undefined)

  @beforeAction @::closeDialog

  dialog: (renderOptions={}) ->
    opts = Batman.extend({into: "modal"}, renderOptions)
    view = @render(opts).on 'ready', =>
      @openDialog()

class App.AnimalsController extends App.ApplicationController
  routingKey: 'animals'

  index: (params) ->
    @set 'newAnimal', new App.Animal
    @set 'animals', App.Animal.get('all.sortedBy.name')
    @renderReact()

  edit: (animal) ->
    @set 'currentAnimal', animal.transaction()
    @renderReact(into: "modal")
    @openDialog()

  show: (params) ->
    App.Animal.find params.id, (err, record) =>
      throw err if err
      @set 'animal', record
      @renderReact()
    @render(false)

  save: (animal) ->
    wasNew = animal.get('isNew')
    animal.save (err, record) =>
      if err
        console.log err
      else
        if wasNew
          @set 'newAnimal', new App.Animal
        Batman.redirect("/")

  destroy: (animal) -> animal.destroy()
class App.Animal extends Batman.Model
  @resourceName: 'animal'
  @NAMES: ["Echidna", "Snail", "Shark", "Starfish", "Parakeet", "Clam", "Dolphin", "Gorilla", "Elephant", "Spider"]
  @COLORS: ["red", "green", "blue", "brown", "black", "yellow", "gray", "orange"].sort()
  @CLASSES: ["Mammal", "Fish", "Reptile", "Bird", "Amphibian", "Invertibrate"]
  @persist BatFire.Storage
  @encode 'name', 'canFly', 'animalClass', 'color'
  @validate 'name', inclusion: { in: @NAMES }
