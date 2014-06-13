class Batman.DOM.React.ForEachBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    prototypeNode = @tagObject
    attrArg = @attrArg
    delete prototypeNode.props["data-foreach-#{attrArg}"]

    list = @parentComponent.enumerate @keypath, attrArg, (item) ->
      extraProps = {}
      extraProps[attrArg] = item
      cpt = cloneComponent(prototypeNode, extraProps)
      cpt
    list