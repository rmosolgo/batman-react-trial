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
    animal.save =>
      if wasNew
        @set 'newAnimal', new App.Animal
        console.log(@get('newAnimal').toJSON())
      Batman.redirect("/")

  destroy: (animal) -> animal.destroy()
class App.Animal extends Batman.Model
  @resourceName: 'animal'
  @COLORS: ["red", "green", "blue", "brown", "black", "yellow", "gray", "orange"].sort()
  @CLASSES: ["Mammal", "Fish", "Reptile", "Bird", "Amphibian", "Invertibrate"]
  @persist BatFire.Storage
  @encode 'name', 'canFly', 'animalClass', 'color'


class App.AnimalsIndexView extends Batman.View
  saveAnimal: (animal) ->
    animal.save (err, r) =>
      @set('newAnimal', new App.Animal)

  destroyAnimal: (animal) -> animal.destroy()

class App.AnimalsEditView extends Batman.View
  saveAnimal: (animal) ->
    animal.save ->
      Batman.redirect("/")
