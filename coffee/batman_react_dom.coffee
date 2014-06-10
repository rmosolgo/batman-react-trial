Batman.DOM.reactReaders =
  bind: (tagName, tagObject, value) ->
    switch tagName
      when "span"
        contentValue = tagObject._owner.sourceKeypath(value)
        if tagObject.isMounted()
          tagObject.setProps(children: contentValue)
        else
          tagObject.props.children = [contentValue]

for tagName, tagFunc of React.DOM
  do (tagName, tagFunc) ->
    Batman.DOM[tagName] = (props, children...) ->
      tagObject = tagFunc.call(React.DOM, props, children...)
      for key, value of props when key.substr(0,5) is "data-"
        [prefix, bindingName, attrArg] = key.split("-")
        bindingFunc = Batman.DOM.reactReaders[bindingName]
        bindingFunc(tagName, tagObject, value, attrArg)
      tagObject
