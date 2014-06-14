class Batman.DOM.React.PartialBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    {type, contextObserver} = @descriptor
    async = false
    Batman.reactComponentForHTMLPath @filteredValue, (componentClass) =>
      injectedContext = @descriptor.props.injectedContext
      childProps = {injectedContext, key: @filteredValue}
      children = [componentClass(childProps).renderBatman()]
      partialDescriptor = {
        type
        props: {}
        children
        contextObserver
      }
      @descriptor = partialDescriptor
      if async
        reactDebug "data-partial async #{@filteredValue}"
        contextObserver.forceUpdate()
    async = true
    @descriptor