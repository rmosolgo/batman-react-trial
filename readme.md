# Batman.js & React

- Get [batman.js](http://batmanjs.org) rendering [react](http://reactjs.com) components
- [Live on firebase](https://batman-react.firebaseapp.com/)

- `Batman.Controller::renderReact` is in `coffee/react/batman_react/`
- Bindings are applied with recursive `bindBatmanDescriptor` in `coffee/react/batman_react_mixin.coffee`
- "bindings" (they're just one-way) are in `/coffee/bindings`

Development:

- `$ gulp`