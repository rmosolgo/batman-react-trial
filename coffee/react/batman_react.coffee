# Batman.Controller::renderReact
# Batman.ContextObserver
# Batman.ReactMixin
# Batman.createComponent

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
      render = -> eval(reactCode)
      componentClass = Batman.createComponent({displayName, render})
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

Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  React.createClass options