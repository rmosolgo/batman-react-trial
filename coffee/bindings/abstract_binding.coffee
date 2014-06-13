# Mostly copy-pasted from Batman.DOM.AbstractBinding
Batman.DOM.React ||= {}

class Batman.DOM.React.AbstractBinding
  # A beastly regular expression for pulling keypaths out of the JSON arguments to a filter.
  # Match either strings, object literals, or keypaths.
  keypath_rx = ///
    (^|,)             # Match either the start of an arguments list or the start of a space in-between commas.
    \s*               # Be insensitive to whitespace between the comma and the actual arguments.
    (?:
      (true|false)
      |
      ("[^"]*")         # Match string literals
      |
      (\{[^\}]*\})      # Match object literals
      |
      (
        ([0-9\_\-]+[a-zA-Z\_\-]|[a-zA-Z]) # Keys that start with a number or hyphen or underscore must contain at least one letter or an underscore
        [\w\-\.\?\!\+]*                   # Now that true and false can't be matched, match a dot delimited list of keys.
      )
    )
    \s*                 # Be insensitive to whitespace before the next comma or end of the filter arguments list.
    (?=$|,)             # Match either the next comma or the end of the filter arguments list.
  ///g

  # A less beastly pair of regular expressions for pulling out the [] syntax `get`s in a binding string, and
  # dotted names that follow them.
  get_dot_rx = /(?:\]\.)(.+?)(?=[\[\.]|\s*\||$)/
  get_rx = /(?!^\s*)\[(.*?)\]/g

  # The `filteredValue` which calculates the final result by reducing the initial value through all the filters.
  getFilteredValue: ->
    unfilteredValue = @getUnfilteredValue()
    self = this
    if @filterFunctions.length > 0
      result = @filterFunctions.reduce((value, fn, i) ->
        # Get any argument keypaths from the context stored at parse time.
        args = self.filterArguments[i].map (argument) ->
          if argument._keypath
            self.lookupKeypath(argument._keypath)
          else
            argument

        # Apply the filter.
        args.unshift value
        args.push undefined while args.length < (fn.length - 1)
        args.push self
        fn.apply(self.view, args)
      , unfilteredValue)

      result
    else
      unfilteredValue
  # The `unfilteredValue` is whats evaluated each time any dependents change.
  getUnfilteredValue: -> @_unfilteredValue(@key)

  _unfilteredValue: (key) ->
    # If we're working with an `@key` and not an `@value`, find the context the key belongs to so we can
    # hold a reference to it for passing to the `dataChange` and `nodeChange` observers.
    if key
      @lookupKeypath(key)
    else
      @value

  lookupKeypath: (keypath) ->
    @descriptor.contextObserver.getContext(keypath)

  constructor: (@descriptor, @bindingName, @keypath, @attrArg) ->
    @tagName =  @descriptor.type
    # Pull out the `@key` and filter from the `@keypath`.
    @parseFilter()
    @filteredValue = @getFilteredValue()

  parseFilter: ->
    # Store the function which does the filtering and the arguments (all except the actual value to apply the
    # filter to) in these arrays.
    @filterFunctions = []
    @filterArguments = []

    # Rewrite [] style gets, replace quotes to be JSON friendly, and split the string by pipes to see if there are any filters.
    keypath = @keypath
    keypath = keypath.replace(get_dot_rx, "]['$1']") while get_dot_rx.test(keypath)  # Stupid lack of lookbehind assertions...
    filters = keypath.replace(get_rx, " | get $1 ").replace(/'/g, '"').split(/(?!")\s+\|\s+(?!")/)

    # The key will is always the first token before the pipe.
    try
      key = @parseSegment(orig = filters.shift())[0]
    catch e
      Batman.developer.warn e
      Batman.developer.error "Error! Couldn't parse keypath in \"#{orig}\". Parsing error above."
    if key and key._keypath
      @key = key._keypath
    else
      @value = key

    if filters.length
      while filterString = filters.shift()
        # For each filter, get the name and the arguments by splitting on the first space.
        split = filterString.indexOf(' ')
        split = filterString.length if split is -1

        filterName = filterString.substr(0, split)
        args = filterString.substr(split)

        filter = Batman.Filters[filterName]
        @filterFunctions.push filter

        # Get the arguments for the filter by parsing the args as JSON, or
        # just pushing an placeholder array
        try
          @filterArguments.push @parseSegment(args)
        catch e
          Batman.developer.error "Bad filter arguments \"#{args}\"!"
      true

  # Turn a piece of a `data` keypath into a usable javascript object.
  #  + replacing keypaths using the above regular expression
  #  + wrapping the `,` delimited list in square brackets
  #  + and `JSON.parse`ing them as an array.
  parseSegment: (segment) ->
    segment = segment.replace keypath_rx, (match, start = '', bool, string, object, keypath, offset) ->
      replacement = if keypath
        '{"_keypath": "' + keypath + '"}'
      else
        bool || string || object
      start + replacement
    JSON.parse("[#{segment}]")

  safelySetProps: (props) ->
    Batman.mixin(@descriptor.props, props)
