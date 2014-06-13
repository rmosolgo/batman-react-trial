class Batman.DOM.React.ContextAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    @parentComponent.setContext(@attrArg, @filteredValue)
    baseContext = @parentComponent._observer.get('baseContext')
    extraProps = {
      contextTarget: new Batman.Object(baseContext)
    }
    displayName = Batman.helpers.camelize("#{@parentComponent.constructor.displayName}_context_#{@attrArg}_component")
    console.log "context #{displayName}", baseContext
    # if !Batman.DOM.React.ContextAttributeBinding[displayName]
    #   prototypeNode = @tagObject
    #   render = ->
    #     BatmanConstructor = Batman.DOM.React.ContextAttributeBinding[displayName]
    #     cloneComponent(prototypeNode)
    #   Batman.DOM.React.ContextAttributeBinding[displayName] =  Batman.createComponent({render, displayName})
    prototypeNode = @tagObject
    render = ->
      @BatmanConstructor = contextComponent
      cloneComponent(prototypeNode)
    contextComponent = Batman.createComponent({render, displayName})
    newTag = contextComponent(Batman.mixin({}, @tagObject.props, extraProps), @tagObject.props.children)
    debugger
    newTag