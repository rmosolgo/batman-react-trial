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
Batman.DOM.reactReaders =
  bind: (tagName, tagObject, value) ->
    switch tagName
      when "span"
        contentValue = tagObject._owner.sourceKeypath(value)
        if tagObject.isMounted()
          tagObject.setProps(children: contentValue)
        else
          tagObject.props.children = [contentValue]

for tagName, tagFunc of React.DOM
  do (tagName, tagFunc) ->
    Batman.DOM[tagName] = (props, children...) ->
      tagObject = tagFunc.call(React.DOM, props, children...)
      for key, value of props when key.substr(0,5) is "data-"
        [prefix, bindingName, attrArg] = key.split("-")
        bindingFunc = Batman.DOM.reactReaders[bindingName]
        bindingFunc(tagName, tagObject, value, attrArg)
      tagObject


Batman.ReactMixin =
  getInitialState: ->
    @_observeContext()
    return {}
  willReceiveProps: (nextProps) ->
    @_observeContext(nextProps)

  componentWillUnmount: ->
    @_observer.die()

  _contextualize: (keypath) ->
    return keypath unless @dataContext?
    parts =  keypath.split(/\./)
    firstPart = parts.shift()
    contextualizedFirstPart = @dataContext[firstPart] || firstPart
    parts.unshift(contextualizedFirstPart)
    parts.join(".")

  updateKeypath: (keypath) ->
    keypath = @_contextualize(keypath)
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      reactDebug "updating " + keypath + " to: ", value
      @_observer.setContext keypath, value

  sourceKeypath: (keypath) ->
    @_observer.getContext(@_contextualize(keypath))

  _observeContext: (props) ->
    props ||= @props
    target = props.target || props.controller
    reactDebug "Observing context with target", target
    @_observer.die() if @_observer
    @_observer = new Batman.ContextObserver(target: target, component: this)

  executeAction: (actionName, params) ->
    (e) =>
      e.preventDefault()
      actionParams = params or e
      @props.controller.executeAction(actionName, actionParams)

  handleWith: (handlerName, withArguments...) ->
    handler = @sourceKeypath(handlerName)
    (e) =>
      e.preventDefault()
      callArgs = withArguments or [e]
      handler(callArgs...)

  enumerate: (setName, itemName, generator) ->
    _getKey = @_getEnumerateKey
    set = @sourceKeypath(setName)
    @sourceKeypath("#{setName}.toArray")
    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + setName.split(".")[0])
    render = ->
      generator.call(this, @props.item)
    iterationComponent = Batman.createComponent({render, displayName})
    outerContext = @_observer.get("context")
    controller = @props.controller
    components = set.map (item) ->
      innerContext = Batman.extend({}, outerContext)
      innerContext[itemName] = item
      target = new Batman.Object(innerContext)
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
        # TODO: Allow routes.people[membership.person].edit
        if part.indexOf(']') > -1
          [objPart, actionPart] = part.split(/\]\./)
          obj = @sourceKeypath(objPart)
          base = base.get(obj)
          base = base.get(actionPart)
        else
          base = base.get(part)
      path = base.get('path')
    Batman.navigator.linkTo(path)

  redirect: (routeQuery) ->
    path = @linkTo(routeQuery)
    (e) ->
      e.stopPropagation()
      Batman.redirect(path)

  addClass: (className, keypath, renderFunc) ->
    val = @sourceKeypath(keypath)
    node = renderFunc()
    if val
      node.className += " #{className}"
    node

  _showIf: (val, callback) ->
    if val
      callback.call(@)
    else
      undefined

  showIf: (keypaths..., callback) ->
    val = true
    for keypath in keypaths
      val = val and @sourceKeypath(keypath)
      if !val
        return @_showIf(!!val, callback)
    @_showIf(!!val, callback)

  hideIf: (keypaths..., callback) ->
    val = true
    for keypath in keypaths
      val = val and @sourceKeypath(keypath)
      if !val
        return @_showIf(!val, callback)
    @_showIf(!val, callback)

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
