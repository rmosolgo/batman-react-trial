class Batman.DOM.React.StyleAttributeBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    styleProp = @descriptor.props.style ||= {}
    styleProp[@attrArg] = @filteredValue
    @descriptor.props.style = styleProp
    @descriptor

  styleStringToObject: (str) ->
    styles = {}
    declarations = str.split(";")

    for declaration in declarations when declaration # don't allow ""
      [property, values...] = declaration.split(":") # allow values with `:` (thanks to batmanjs source)
      value = values.join(":")
      propertyName = Batman.helpers.camelize(property, true) # lowercase first letter
      styles[propertyName] = value

    styles