# Batman.js & React

[Batman.js](http://batmanjs.org) rendering batman.js templates with [react](http://reactjs.com). [Live on firebase](https://batman-react.firebaseapp.com/).


Some interesting bits:

- [HTML templates are converted into React components](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react.coffee#L14)
- [`Batman.Controller::renderReact`](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react.coffee#L36) puts components into `data-yield` containers
- `renderReact` is a [drop-in replacement](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/controllers.coffee#L25) for `render`
- JSX is [invoked with `Batman.DOM`](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react.coffee#L30), whose [functions return descriptor-like objects](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react_dom.coffee#L40)
- During `render`, descriptors are [enriched](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react_mixin.coffee#L42) with one-way ["bindings"](https://github.com/rmosolgo/batman-react-trial/tree/master/coffee/bindings) that match the existing batmanjs binding API
- [`Batman.ContextObserver`](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react_context_observer.coffee) stores observers for `forceUpdate`-ing the component


Getting context into the components and observing it properly is not good yet.

`ContextObserver` still has some leaks:

- Binding to new objects (eg the `newAnimal` form at the bottom of the home page)
- It will keep tracking items that were removed from `data-foreach` collections :(

The whole [`injectedContext`](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/bindings/for_each_binding.coffee#L20) idea is weak too: I spit POJOs into [child descriptors](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/react/batman_react_mixin.coffee#L71) so their bindings can [lookup against them](https://github.com/rmosolgo/batman-react-trial/blob/master/coffee/bindings/abstract_binding.coffee#L66).

Development:

- `$ npm install && npm install -g gulp`
- `$ gulp`