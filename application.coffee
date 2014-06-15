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
    @descriptor.context.get(keypath)

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
              {checked: false}
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
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      reactDebug "updating " + keypath + " to: ", value
      @descriptor.context.set(keypath, value)
class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.context = @descriptor.context.injectContext(@attrArg, @filteredValue)
    @descriptor
class Batman.DOM.React.ContextBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.props.injectedContext ||= {}
    @descriptor.props.injectedContext._injectedObjects ||= []
    @descriptor.props.injectedContext._injectedObjects.push(@filteredValue)
    @descriptor
class Batman.DOM.React.DebugBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    debugger
    @descriptor
class Batman.DOM.React.EventBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    handler = @filteredValue
    eventHandlers = {}
    eventHandlers["on#{Batman.helpers.camelize(@attrArg)}"] = (e) =>
      e.preventDefault()
      handler()
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
    _removeBinding = @_removeForEachBinding.bind(@)
    itemName = @attrArg
    collectionName = @keypath
    collection = @filteredValue
    return [] if !collection
    {type, children, props, context} = @descriptor

    displayName = Batman.helpers.camelize("enumerate_" + itemName + "_in_" + collectionName.split(".")[0])

    if collection?.toArray
      collection = collection.toArray()

    newDescriptors = []
    Batman.forEach collection, (item) ->
      key = _getKey(item)
      injectedContext = context.injectContext(itemName, item)
      newProps = Batman.mixin({}, props, {key})
      _removeBinding(newProps)
      descriptor = new Batman.DOM.React.Descriptor({
        type
        children: cloneDescriptor(children, injectedContext)
        props: newProps
        context: injectedContext
      })
      newDescriptors.push(descriptor)
    newDescriptors

  _getEnumerateKey: (item) ->
    if item.hashKey?
      item.hashKey()
    else
      JSON.stringify(item)

  _removeForEachBinding: (props) ->
    forEachProp = {}
    forEachProp["data-foreach-#{@attrArg}"] = true
    Batman.unmixin(props, forEachProp)

cloneDescriptor = (descriptor, ctx) ->
  # console.log "cloning", descriptor
  if descriptor instanceof Array
    (cloneDescriptor(item) for item in descriptor)
  else if descriptor instanceof Batman.DOM.React.Descriptor
      newDescriptor = new Batman.DOM.React.Descriptor({
        type: descriptor.type
        props: Batman.mixin({}, descriptor.props)
        children: cloneDescriptor(descriptor.children, ctx)
        context: ctx
      })
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
class Batman.DOM.React.PartialBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    {type, context} = @descriptor
    async = false
    Batman.reactComponentForHTMLPath @filteredValue, (componentClass) =>
      injectedContext = @descriptor.props.injectedContext
      childProps = {injectedContext, key: @filteredValue}
      children = [componentClass(childProps).renderBatman()]
      partialDescriptor = {
        type
        props: {}
        children
        context
      }
      @descriptor = partialDescriptor
      if async
        reactDebug "data-partial async #{@filteredValue}"
        context.forceUpdate()
    async = true
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
class Batman.DOM.React.StyleAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    styleProp = @descriptor.props.style ||= {}
    styleProp[@attrArg] = @filteredValue
    @descriptor.props.style = styleProp
    @descriptor

  styleStringToObject: (str) ->
    styles = {}
    declarations = str.split(";")

    for declaration in declarations when declaration # don't allow ""
      [property, values...] = declaration.split(":") # allow values with `:` (thanks to batmanjs source)
      value = values.join(":")
      propertyName = Batman.helpers.camelize(property, true) # lowercase first letter
      styles[propertyName] = value

    styles
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

Batman.reactComponentForRoutingKeyAndAction = (routingKey, action, callback) ->
  componentName = Batman.helpers.camelize("#{routingKey}_#{action}_component")
  componentClass = Batman.currentApp[componentName]
  if !componentClass
    HTMLPath = "#{routingKey}/#{action}"
    Batman.reactComponentForHTMLPath HTMLPath, (componentClass) ->
      componentClass.displayName = componentName
      Batman.currentApp[componentName] = componentClass
      console.log("Defined React Component: #{componentName}")
      callback(componentClass)
  else
    callback(componentClass)

Batman.reactComponentForHTMLPath = (HTMLPath, callback) ->
  Batman.View.store.onResolved HTMLPath, =>
    html = Batman.View.store.get(HTMLPath)
    wrappedHTML = "/** @jsx Batman.DOM */\n<div>#{html}</div>"
    reactCode = JSXTransformer.transform(wrappedHTML).code
    renderBatman = -> eval(reactCode)
    componentClass = Batman.createComponent({renderBatman})
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
  Batman.reactComponentForRoutingKeyAndAction @get('routingKey'), options.action, (componentClass) =>
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

class Batman.ContextObserver extends Batman.Hash
  @COUNT = 0
  constructor: ({@component, @target}) ->
    super({})
    @constructor.COUNT += 1
    @_logCount()
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
    @_logProperties ||= Batman.setImmediate =>
      if @DEAD
        console.log("Observer was killed")
      else
        console.log("Now tracking #{@_properties.length} properties")
      @_logProperties = false
    return false if prop in @_properties
    @_properties.push(prop)
    prop.observe(@forceUpdate)
    prop.observe (nv, ov) -> reactDebug "forceUpdate because of #{prop.key} #{Batman.Filters.truncate(JSON.stringify(ov), 15)} -> #{Batman.Filters.truncate(JSON.stringify(nv), 15)}"
    return true

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
    if @DEAD
      console.warn("This context observer was already killed!")
      return
    @DEAD = true
    @constructor.COUNT -= 1
    @_logCount()
    for property in @_properties
      property?.forget(@forceUpdate)

    @_properties = null
    @off()

  _logCount: ->
    return if @constructor._logging
    @constructor._logging = Batman.setImmediate =>
      console.log("#{@constructor.COUNT} ContextObservers")
      @constructor._logging = false

class Batman.DOM.React.Descriptor extends Batman.Object
  @COUNTER: 0
  @UPDATING: false

  constructor: ({@type, @props, @children, @context}) ->
    # @context is added later ...

  @accessor 'toReact', ->
    reactDescriptor = @performReactTransforms()
    {type, props, children} = reactDescriptor
    if children?.length
      children = (@_handleTransformedDescriptor(child, @context) for child in children)

    if type?
      React.DOM[type](props, children)
    else
      reactDescriptor


  performReactTransforms:  ->
    descriptor = {@type, @props, @children, @context}

    for key, value of @props when key.substr(0,5) is "data-"
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
        console.warn("No binding found for #{key}=#{value} on #{@type}")
      else if bindingName is "foreach"
        descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()
        break
      else
        descriptor = new bindingClass(descriptor, bindingName, value, attrArg).applyBinding()


    @_handleTransformedDescriptor(descriptor, @context)

  _handleTransformedDescriptor: (descriptor, context) ->
    if descriptor instanceof Array
      # debugger
      (@_handleTransformedDescriptor(child, context) for child in descriptor)
    else if descriptor instanceof Batman.DOM.React.Descriptor
      descriptor.context ||= context
      descriptor.get('toReact')
    else
      descriptor
Batman.DOM.reactReaders =
  bind: Batman.DOM.React.BindBinding
  route: Batman.DOM.React.RouteBinding
  showif: Batman.DOM.React.ShowIfBinding
  hideif: Batman.DOM.React.HideIfBinding
  partial: Batman.DOM.React.PartialBinding
  context: Batman.DOM.React.ContextBinding
  debug: Batman.DOM.React.DebugBinding

  # TODO: add data-route-params
  # view: (definition) ->
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
  style: Batman.DOM.React.StyleAttributeBinding

  ## WONTFIX:
  formfor: Batman.DOM.React.ContextAttributeBinding
  source: Batman.DOM.React.BindAttributeBinding


for type, tagFunc of React.DOM
  do (type, tagFunc) ->
    Batman.DOM[type] = (props, children...) ->
      # you can use `class=` with Batman.DOM
      if classes = props?.class
        props.className = classes
        delete props.class

      # style can be a string
      if styles = props?.style
        props.style = Batman.DOM.React.StyleAttributeBinding::styleStringToObject(styles)

      descriptor = new Batman.DOM.React.Descriptor({type, props, children})




Batman.ReactMixin =
  getInitialState: ->
    reactDebug "getInitialState #{@constructor?.displayName || @props?.key}"
    @_createTopLevelContext()
    return {}

  componentWillUnmount: ->
    if @_context.component is @ # don't let data-partials kill the main observer!
      reactDebug "componentWillUnmount, killing context"
      @_context.die()

  _createTopLevelContext: ->
    @_context ||= new Batman.DOM.React.Context({controller: @props.controller, component: @})

  _setupTreeDescriptor: ->
    @treeDescriptor = @renderBatman()
    @treeDescriptor.context = @_context
    console.log "observing #{@treeDescriptor.get('_batmanID')}"
    @treeDescriptor.property('toReact').observe =>
      console.log "forceupdate"
      @forceUpdate()

  renderTree: ->
    if !@treeDescriptor
      @_setupTreeDescriptor()
    react = @treeDescriptor.get('toReact')
    # debugger
    react


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
  @NAMES: ["Echidna", "Snail", "Shark", "Starfish", "Parakeet", "Clam", "Dolphin", "Gorilla", "Bat", "Spider", "Tyrannosaurus Rex"]
  @COLORS: ["red", "green", "blue", "brown", "black", "yellow", "gray", "orange"].sort()
  @CLASSES: ["Mammal", "Fish", "Reptile", "Bird", "Amphibian", "Invertibrate"]
  @persist BatFire.Storage
  @encode 'name', 'canFly', 'animalClass', 'color'
  @validate 'name', inclusion: { in: @NAMES }

  @accessor 'toString', -> "#{@get('name')} #{@get('animalClass')}"

  @accessor 'fontSize', -> @get('name.length') * 2