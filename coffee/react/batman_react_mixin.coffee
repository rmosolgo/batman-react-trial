
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