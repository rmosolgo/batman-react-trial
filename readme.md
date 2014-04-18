# Rendering Batman.js Views into Modal

This is a working example of using the Bootstrap modal with batman.js.

To render into a modal:

- Set up a [`data-yield='modal'`](https://gist.github.com/rmosolgo/10606481#file-index-html-L15).
- [Observe `Batman.DOM.Yield.get('yields.modal.contentView')`](https://gist.github.com/rmosolgo/10606481#file-application-coffee-L13) for when a view is rendered. Open the modal inside that observer.
- Create a function on ApplicationController to [close the dialog and `die` the view](https://gist.github.com/rmosolgo/10606481#file-application-coffee-L28) and [add it as a `beforeAction`](https://gist.github.com/rmosolgo/10606481#file-application-coffee-L34).
- For actions which should render into the modal, explicitly render: [`@render(into: 'modal')`](https://gist.github.com/rmosolgo/10606481#file-application-coffee-L44). The modal will be opened automatically by the observer.

For more batman.js recipes, see the [Batman.js MVC Cookbook](https://www.softcover.io/books/69/redirect)!