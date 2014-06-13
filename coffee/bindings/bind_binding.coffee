class Batman.DOM.React.BindBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    switch @tagName
      when "input"
        onChange = @parentComponent.updateKeypath(@keypath)
        inputType = @tagObject.props.type.toLowerCase()
        newProps = switch inputType
          when "checkbox"
            if !!@filteredValue
              {checked: true}
            else
              {}
          when "radio"
            # console.log @filteredValue, @tagObject.props.value
            if @filteredValue? and @filteredValue is @tagObject.props.value
              {checked: true}
            else
              {}
          else
            {value: @filteredValue}
        newProps.onChange = onChange
      when "select"
        debugger
        newProps =
          value: @filteredValue
          onChange: @parentComponent.updateKeypath(@keypath)
      else # set innerText

        if @filteredValue?
          contentValue = "#{@filteredValue}"
          newProps = {children: [contentValue]}

    @safelySetProps(newProps)
    # console.log "BindBinding #{JSON.stringify(newProps)}"
    @tagObject