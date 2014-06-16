Batman.ReactMixin =
  componentWillReceiveProps: ->
    @_createTopLevelContext()

  componentWillMount: ->
    @_createTopLevelContext()

  componentWillUnmount: ->
    if @_context.component is @
      @_context.die()
      @_context = null
      reactDebug "componentWillUnmount, killing context"

  _createTopLevelContext: ->
    if !@_context? or @_context?.isDead
      @_context = new Batman.DOM.React.Context({controller: @props.controller, component: @})
      console.log "CONTEXT assigned #{@_context.get("_batmanID")}"

  _setupTreeDescriptor: ->
    @treeDescriptor = @renderBatman()
    @treeDescriptor.context = @_context
    console.log "observing #{@treeDescriptor.get('_batmanID')}"
    @treeDescriptor.property('toReact').observe =>
      @forceUpdate()

  renderTree: ->
    @_createTopLevelContext()
    if !@treeDescriptor
      @_setupTreeDescriptor()
    else
      @treeDescriptor.context = @_context
    react = @treeDescriptor.get('toReact')
    react


Batman.createComponent = (options) ->
  options.mixins = options.mixins or []
  options.mixins.push Batman.ReactMixin
  options.render = Batman.ReactMixin.renderTree
  React.createClass options