# Mostly copy-pasted from Batman.DOM.AbstractBinding
Batman.DOM.React ||= {}

class Batman.DOM.React.AbstractBinding
  # A beastly regular expression for pulling keypaths out of the JSON arguments to a filter.
  # Match either strings, object literals, or keypaths.
  keypath_rx = ///
    (^|,)             # Match either the start of an arguments list or the start of a space in-between commas.
    \s*               # Be insensitive to whitespace between the comma and the actual arguments.
    (?:
      (true|false)
      |
      ("[^"]*")         # Match string literals
      |
      (\{[^\}]*\})      # Match object literals
      |
      (
        ([0-9\_\-]+[a-zA-Z\_\-]|[a-zA-Z]) # Keys that start with a number or hyphen or underscore must contain at least one letter or an underscore
        [\w\-\.\?\!\+]*                   # Now that true and false can't be matched, match a dot delimited list of keys.
      )
    )
    \s*                 # Be insensitive to whitespace before the next comma or end of the filter arguments list.
    (?=$|,)             # Match either the next comma or the end of the filter arguments list.
  ///g

  # A less beastly pair of regular expressions for pulling out the [] syntax `get`s in a binding string, and
  # dotted names that follow them.
  get_dot_rx = /(?:\]\.)(.+?)(?=[\[\.]|\s*\||$)/
  get_rx = /(?!^\s*)\[(.*?)\]/g

  # The `filteredValue` which calculates the final result by reducing the initial value through all the filters.
  getFilteredValue: ->
    unfilteredValue = @getUnfilteredValue()
    self = this
    if @filterFunctions.length > 0
      result = @filterFunctions.reduce((value, fn, i) ->
        # Get any argument keypaths from the context stored at parse time.
        args = self.filterArguments[i].map (argument) ->
          if argument._keypath
            self.lookupKeypath(argument._keypath)
          else
            argument

        # Apply the filter.
        args.unshift value
        args.push undefined while args.length < (fn.length - 1)
        args.push self
        fn.apply(self.view, args)
      , unfilteredValue)

      result
    else
      unfilteredValue
  # The `unfilteredValue` is whats evaluated each time any dependents change.
  getUnfilteredValue: -> @_unfilteredValue(@key)

  _unfilteredValue: (key) ->
    # If we're working with an `@key` and not an `@value`, find the context the key belongs to so we can
    # hold a reference to it for passing to the `dataChange` and `nodeChange` observers.
    if key
      @lookupKeypath(key)
    else
      @value

  lookupKeypath: (keypath) ->
    @descriptor.contextObserver.getContext(keypath)

  constructor: (@descriptor, @bindingName, @keypath, @attrArg) ->
    @tagName =  @descriptor.type
    # Pull out the `@key` and filter from the `@keypath`.
    @parseFilter()
    @filteredValue = @getFilteredValue()

  parseFilter: ->
    # Store the function which does the filtering and the arguments (all except the actual value to apply the
    # filter to) in these arrays.
    @filterFunctions = []
    @filterArguments = []

    # Rewrite [] style gets, replace quotes to be JSON friendly, and split the string by pipes to see if there are any filters.
    keypath = @keypath
    keypath = keypath.replace(get_dot_rx, "]['$1']") while get_dot_rx.test(keypath)  # Stupid lack of lookbehind assertions...
    filters = keypath.replace(get_rx, " | get $1 ").replace(/'/g, '"').split(/(?!")\s+\|\s+(?!")/)

    # The key will is always the first token before the pipe.
    try
      key = @parseSegment(orig = filters.shift())[0]
    catch e
      Batman.developer.warn e
      Batman.developer.error "Error! Couldn't parse keypath in \"#{orig}\". Parsing error above."
    if key and key._keypath
      @key = key._keypath
    else
      @value = key

    if filters.length
      while filterString = filters.shift()
        # For each filter, get the name and the arguments by splitting on the first space.
        split = filterString.indexOf(' ')
        split = filterString.length if split is -1

        filterName = filterString.substr(0, split)
        args = filterString.substr(split)

        filter = Batman.Filters[filterName]
        @filterFunctions.push filter

        # Get the arguments for the filter by parsing the args as JSON, or
        # just pushing an placeholder array
        try
          @filterArguments.push @parseSegment(args)
        catch e
          Batman.developer.error "Bad filter arguments \"#{args}\"!"
      true

  # Turn a piece of a `data` keypath into a usable javascript object.
  #  + replacing keypaths using the above regular expression
  #  + wrapping the `,` delimited list in square brackets
  #  + and `JSON.parse`ing them as an array.
  parseSegment: (segment) ->
    segment = segment.replace keypath_rx, (match, start = '', bool, string, object, keypath, offset) ->
      replacement = if keypath
        '{"_keypath": "' + keypath + '"}'
      else
        bool || string || object
      start + replacement
    JSON.parse("[#{segment}]")

  safelySetProps: (props) ->
    Batman.mixin(@descriptor.props, props)

class Batman.DOM.React.AddClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @descriptor.props.className || ""
      className += " #{@attrArg}"
      # reactDebug "AddClassBinding setting '#{@attrArg}'"
      @safelySetProps({className})
    @descriptor
class Batman.DOM.React.BindAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    newProps = {}
    newProps[@attrArg] = @filteredValue
    @safelySetProps(newProps)
    @descriptor
class Batman.DOM.React.BindBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    switch @tagName
      when "input"
        inputType = @descriptor.props.type.toLowerCase()
        newProps = switch inputType
          when "checkbox"
            if !!@filteredValue
              {checked: true}
            else
              {}
          when "radio"
            if @filteredValue? and @filteredValue is @descriptor.props.value
              {checked: true}
            else
              {}
          else
            {value: @filteredValue}
        newProps.onChange = @updateKeypath()
      when "select"
        newProps =
          value: @filteredValue
          onChange: @updateKeypath()
      else # set innerText

        if @filteredValue?
          @descriptor.children = "#{@filteredValue}"
          # console.log "BindBinding #{@keypath} => #{@filteredValue}"
          newProps = {}

    @safelySetProps(newProps)
    @descriptor


  updateKeypath: (keypath=@keypath) ->
    observer = @descriptor.contextObserver
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      reactDebug "updating " + keypath + " to: ", value
      observer.setContext(keypath, value)
class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.contextObserver.setContext(@attrArg, @filteredValue || null)
    @descriptor
class Batman.DOM.React.EventBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    handler = @filteredValue
    eventHandlers = {}
    eventHandlers["on#{Batman.helpers.camelize(@attrArg)}"] = (e) ->
      e.preventDefault()
      handler.apply(@, arguments)
    @safelySetProps(eventHandlers)
    @descriptor


  # _unfilteredValue: (key) ->
  #   @unfilteredKey = key
  #   if not @functionName and (index = key.lastIndexOf('.')) != -1
  #     @functionPath = key.substr(0, index)
  #     @functionName = key.substr(index + 1)

  #   value = super(@functionPath || key)
  #   if @functionName
  #     value?[@functionName]
  #   else
  #     value

class Batman.DOM.React.ForEachBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    _getKey = @_getEnumerateKey
    itemName = @attrArg
    collectionName = @keypath
    collection = @filteredValue
    {type, children, props} = @descriptor
    forEachProp = {}
    forEachProp["data-foreach-#{itemName}"] = true
    Batman.unmixin(props, forEachProp)

    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0])

    # only pass base objects to the child so that nested keypaths will be looked up against it
    baseContext = @descriptor.contextObserver.get('baseContext')
    delete baseContext[itemName]

    component = @descriptor.contextObserver.component

    if collection?.toArray
      collection = @lookupKeypath("#{@keypath}.toArray")

    list = for item in collection
      innerContext = Batman.extend({}, baseContext)
      key = _getKey(item)
      innerContext[itemName] = item
      # TODO: How can i not instantiate batman objects here??
      contextTarget = new Batman.Object(innerContext)
      contextObserver = new Batman.ContextObserver(target: contextTarget, component: component)
      newProps = Batman.mixin({item, key}, props)
      descriptor = {
        type
        children: cloneDescriptor(children)
        props: newProps
        contextObserver
      }
      # reactDebug "#{type} for #{itemName} #{item.get('name')} => #{JSON.stringify(newProps)} #{contextObserver.get('_batmanID')}", descriptor
      bindBatmanDescriptor(descriptor)
    list

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)

cloneDescriptor = (descriptor, ctx) ->
  argType = Batman.typeOf(descriptor)
  switch argType
    when "Array"
      (cloneDescriptor(item) for item in descriptor)
    when "Object"
      newDescriptor = {}
      for key, value of descriptor
        if key in ["contextObserver"]
          continue
        else
          newDescriptor[key] = cloneDescriptor(value)
      newDescriptor
    else
      descriptor

class Batman.DOM.React.HideIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    contentValue = @filteredValue
    Batman.DOM.React.ShowIfBinding::_showIf.call(@, !contentValue)
    @descriptor
class Batman.DOM.React.NotImplementedBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    attrArg = if @attrArg
        "-#{@attrArg}"
      else
        ""
    console.warn("This binding is not supported: <#{@tagName} data-#{@bindingName}#{attrArg}=#{@keypath} />")
    @descriptor
class Batman.DOM.React.RemoveClassBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    if @filteredValue
      className = @descriptor.props.className || ""
      className = className.replace("#{@attrArg}", "")
      # reactDebug "RemoveClassBinding removing #{@attrArg}"
      @safelySetProps({className})
    @descriptor
class Batman.DOM.React.RouteBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    path = if @filteredValue instanceof Batman.NamedRouteQuery
        @filteredValue.get('path')
      else
        @filteredValue
    onClick = (e) ->
      e.stopPropagation()
      Batman.redirect(path)
    href = Batman.navigator.linkTo(path)
    @safelySetProps({onClick, href})
    @descriptor
class Batman.DOM.React.ShowIfBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    contentValue = @filteredValue
    @_showIf(!!contentValue)
    @descriptor

  _showIf: (trueOrFalse) ->
    style = Batman.mixin({}, @descriptor.props.style || {})
    if !trueOrFalse
      style.display = 'none !important'
    else
      delete style.display # in the context of a foreach binding, it could inherit a failed test from the prototype node
    @safelySetProps({style})
# Batman.Controller::renderReact

Batman.HTMLStore::onResolved = (path, callback) ->
  if @get(path) == undefined
    @observeOnce path, callback
  else
    callback()


@BatmanReactDebug = true
@reactDebug = ->
  if BatmanReactDebug
    console.log(arguments...)

reactComponentForRoutingKeyAndAction = (routingKey, action, callback) ->
  componentName = Batman.helpers.camelize("#{routingKey}_#{action}_component")
  componentClass = Batman.currentApp[componentName]
  if !componentClass
    HTMLPath = "#{routingKey}/#{action}"
    Batman.View.store.onResolved HTMLPath, =>
      html = Batman.View.store.get(HTMLPath)
      wrappedHTML = "/** @jsx Batman.DOM */\n<div>#{html}</div>"
      reactCode = JSXTransformer.transform(wrappedHTML).code
      displayName = componentName
      renderBatman = -> eval(reactCode)
      componentClass = Batman.createComponent({displayName, renderBatman})
      Batman.currentApp[componentName] = componentClass
      console.log("Defined React Component: #{componentName}")
      callback(componentClass)
  else
    callback(componentClass)

Batman.Controller::renderReact = (options={}) ->
  if frame = @_actionFrames?[@_actionFrames.length - 1]
    frame.startOperation()

  # Ensure the frame is marked as having had an action executed so that render false prevents the implicit render.
  if options is false
    frame.finishOperation()
    return

  # look up the component by name
  options.frame = frame
  options.action = frame?.action || @get('action')
  options.componentName = Batman.helpers.camelize("#{@get('routingKey')}_#{options.action}_component")
  options.componentClass = Batman.currentApp[options.componentName]

  # TODO: Support components with defined functions etc, but have their render functions provided by Batman.React
  reactComponentForRoutingKeyAndAction @get('routingKey'), options.action, (componentClass) =>
    options.componentClass = componentClass
    @finishRenderReact(options)

Batman.Controller::finishRenderReact = (options) ->
  # instantiate and render the component (cleaning up an existing one)
  yieldName = options.into || "main"
  targetYield = Batman.DOM.Yield.withName(yieldName)
  yieldNode = targetYield.containerNode

  component = options.componentClass(controller: @)
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
  reactDebug "rendered #{@routingKey}/#{options.action}", options.componentName
  options.frame?.finishOperation()

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

Batman.DOM.reactReaders =
  bind: Batman.DOM.React.BindBinding
  route: Batman.DOM.React.RouteBinding
  showif: Batman.DOM.React.ShowIfBinding
  hideif: Batman.DOM.React.HideIfBinding

  # TODO: add data-route-params
  # context: (definition) ->
  # view: (definition) ->
  # partial: (definition) ->
  # contentfor: (definition) ->
  # yield: (definition) ->

  ## WONTFIX:
  target: Batman.DOM.React.BindBinding
  source: Batman.DOM.React.BindBinding
  ## WONT IMPLEMENT:
  defineview: Batman.DOM.React.NotImplementedBinding
  insertif: Batman.DOM.React.NotImplementedBinding
  removeif: Batman.DOM.React.NotImplementedBinding
  deferif: Batman.DOM.React.NotImplementedBinding
  renderif: Batman.DOM.React.NotImplementedBinding

Batman.DOM.reactAttrReaders =
  foreach: Batman.DOM.React.ForEachBinding
  event: Batman.DOM.React.EventBinding
  bind: Batman.DOM.React.BindAttributeBinding
  addclass: Batman.DOM.React.AddClassBinding
  removeclass: Batman.DOM.React.RemoveClassBinding
  context: Batman.DOM.React.ContextAttributeBinding
  # track: (definition) ->
  # style: (definition) ->

  ## WONTFIX:
  formfor: Batman.DOM.React.ContextAttributeBinding
  source: Batman.DOM.React.BindAttributeBinding


for tagName, tagFunc of React.DOM
  do (tagName, tagFunc) ->
    Batman.DOM[tagName] = (props, children...) ->
      # you can use `class=` with Batman.DOM
      if classes = props?.class
        props.className = classes
        delete props.class
      # bindBatmanDescriptor will add context
      descriptor = {
        type: tagName
        props
        children
      }




Batman.ReactMixin =
  getInitialState: ->
    @_observeContext()
    return {}
  willReceiveProps: (nextProps) ->
    @_observeContext(nextProps)

  componentWillUnmount: ->
    @_observer.die()

  _observeContext: (props) ->
    props ||= @props
    target = props.contextTarget || new Batman.Object
    reactDebug "observing contextTarget", target
    @_observer.die() if @_observer
    @_observer = new Batman.ContextObserver(target: target, component: this)

  renderTree: ->
    tree = @renderBatman()
    tree.contextObserver = @_observer
    components = bindBatmanDescriptor(tree)
    components

bindBatmanDescriptor = (descriptor = {}) ->
  descriptorType = Batman.typeOf(descriptor)
  return descriptor if descriptorType is "String"

  for key, value of descriptor.props when key.substr(0,5) is "data-"
    keyParts = key.split("-")
    bindingName = keyParts[1]

    if keyParts.length > 2
      attrArg = keyParts.slice(2).join("-") # allows data-addclass-alert--error
    else # have to unset since this isn't in a closure
      attrArg = undefined

    if attrArg?
      bindingClass = Batman.DOM.reactAttrReaders[bindingName]
    else
      bindingClass = Batman.DOM.reactReaders[bindingName]

    if !bindingClass
      console.warn("No binding found for #{key}=#{value} on #{descriptor.type}")
    else
      descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()
      # foreach binding returns an array of children!
      if bindingName is "foreach"
        break

  if descriptor?.type
    {type, props, children} = descriptor
    newChildren = for child in children
      child.contextObserver ?= descriptor.contextObserver
      bindBatmanDescriptor(child)
    React.DOM[type](props, newChildren...)
  else
    descriptor

Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  options.render = Batman.ReactMixin.renderTree
  React.createClass options
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
      , 5000
    # Batman.redirect("/")

  # Just to make things interesting, make some Animals
  @_seedData: ->
    totalAnimals = App.Animal.get('all.length')
    if totalAnimals is 0
      console.log "No data found, running seeds!"
      for n in ["Spider", "Starfish", "Echidna"]
        animal = new App.Animal(name: n)
        animal.save()

$ -> App.run()



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
    App.Animal.load =>
      @set 'newAnimal', new App.Animal
      @set 'animals', App.Animal.get('all.sortedBy.name')
      @renderReact()
    @render(false)

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

  @accessor 'toString', -> "#{@get('name')} #{@get('animalClass')}"