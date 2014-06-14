class Batman.DOM.React.ContextBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @descriptor.props.injectedContext ||= {}
    @descriptor.props.injectedContext._injectedObjects ||= []
    @descriptor.props.injectedContext._injectedObjects.push(@filteredValue)
    @descriptor