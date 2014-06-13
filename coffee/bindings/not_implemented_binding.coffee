class Batman.DOM.React.NotImplementedBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    attrArg = if @attrArg
        "-#{@attrArg}"
      else
        ""
    console.warn("This binding is not supported: <#{@tagName} data-#{@bindingName}#{attrArg}=#{@keypath} />")
    @descriptor