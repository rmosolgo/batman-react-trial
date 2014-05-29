App.AnimalsEditComponent = React.createClass({
  updateKeypath: function (keypath) {
    var controller = this.props.controller;
    return function(e) {
      debugger
      controller.set(keypath, e.target.value)
    }
  },
  render: function() {
    return (
      <div>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>Edit</span>
            <span data-bind="currentAnimal.name" />
          </h2>
        </div>
        <div className="modal-body">
          <form data-formfor-animal="currentAnimal" onSubmit={this.props.controller.saveAnimal}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="form-control" onChange={updateKeypath('currentAnimal.name')}/>
            </div>
            <input type="submit" value="Save" className="btn btn-success" />
          </form>
        </div>
        <div className="modal-footer">
          <button data-event-click="closeDialog" className="btn">Close</button>
        </div>
      </div>
    );
  }
});