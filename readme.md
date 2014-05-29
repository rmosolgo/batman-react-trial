# Batman.js & React

- Get [batman.js](http://batmanjs.org) rendering [react](http://reactjs.com) components
- [Live on firebase](https://batman-react.firebaseapp.com/)

The good stuff is in `/coffee/batman.react.coffee`:

- `Batman.Controller::renderReact` for looking up and rendering components
- `Batman.ContextObserver` for keeping batman.js and react in sync
- `Batman.ReactMixin` for implementing some simple bindings
- `Batman.createComponent` as shorthand for mixing in the bindings

See examples in `/cjsx/react_components.coffee`


Development:

- `$ gulp`
- `$ harp server`
- `$ cjsx -cbw -o build/ cjsx/`