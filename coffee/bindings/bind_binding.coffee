class Batman.DOM.React.BindBinding extends Batman.DOM.React.AbstractBinding
  applyBinding: ->
    switch @tagName
      when "input"
        inputType = @descriptor.props.type.toLowerCase()
        newProps = switch inputType
          when "checkbox"
            if !!@filteredValue
              {checked: true}
            else
              {checked: false}
          when "radio"
            if @filteredValue? and @filteredValue is @descriptor.props.value
              {checked: true}
            else
              {checked: false}
          else
            {value: @filteredValue}
        newProps.onChange = @updateKeypath()
      when "select"
        newProps =
          value: @filteredValue ? ""
          onChange: @updateKeypath()
      else # set innerText

        if @filteredValue?
          @descriptor.children = "#{@filteredValue}"
          # console.log "BindBinding #{@keypath} => #{@filteredValue}"
          newProps = {}

    @safelySetProps(newProps)
    @descriptor


  updateKeypath: (keypath=@keypath) ->
    (e) =>
      value = switch e.target.type.toUpperCase()
        when "CHECKBOX" then e.target.checked
        else e.target.value
      reactDebug "updating " + keypath + " to: ", value
      @descriptor.context.set(keypath, value)