class Batman.DOM.React.PartialBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    {type, context, props} = @descriptor
    async = false
    Batman.reactCodeForHTMLPath @filteredValue, (reactFunc) =>
      childProps = {key: @filteredValue}
      children = [reactFunc(childProps)]
      partialDescriptor = {
        type
        props
        children
        context
      }
      @descriptor = partialDescriptor
      if async
        context.component.forceUpdate()
    async = true
    @descriptor