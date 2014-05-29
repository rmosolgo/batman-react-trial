# @cjsx React.DOM
App.AnimalsShowComponent = Batman.createComponent
  render: ->
    <div>
      <h1>{@sourceKeypath('animal.name')}</h1>
      <p>This is just an example of routing.</p>
      <a href={@linkTo('routes.animals')} className='btn btn-primary'>Go back</a>
    </div>



App.AnimalsIndexComponent = Batman.createComponent
  render: ->
    animals = @enumerate "animals", "animal", (animal) ->
      canFly = ""
      if @sourceKeypath('animal.canFly')
        canFly = <span className="text-muted"> (can fly)</span>
      <li key={animal.get('_batmanID')}>
        <div className="row">
          <div className="col-xs-6">
            <a href={@linkTo("routes.animals[animal]")}>
              <p className="lead">
                {@sourceKeypath('animal.name')}
                {canFly}
              </p>
            </a>
          </div>
          <div className="col-xs-2">
            <small>{@sourceKeypath("animal.animalClass")}</small>
          </div>
          <div className="col-xs-2">
            <button onClick={@executeAction("edit", animal)} className="btn">Edit in Dialog</button>
          </div>
          <div className="col-xs-2">
            <button onClick={@handleWith("destroy", animal)} className="btn btn-danger">Destroy</button>
          </div>
        </div>
      </li>

    <div className="row">
      <h1>
        All Animals
        <small> ({@sourceKeypath("animals.length")})</small>
      </h1>
      <ul className="list-unstyled">
        {animals}
      </ul>
      <p className="row">
        <div className="well">
          <form onSubmit={@handleWith("save", @sourceKeypath('newAnimal'))}>
            <div className="form-group">
              <label>New Animal:</label>
              <input type="text" className="form-control" value={@sourceKeypath("newAnimal.name")} onChange={@updateKeypath('newAnimal.name')}/>
            </div>
            <input type="submit" value="Save" className="btn btn-primary"/>
          </form>
        </div>
      </p>
    </div>


App.AnimalsEditComponent = Batman.createComponent
  render: ->
    return (
      <div>
        <div className="modal-header">
          <h2 className="modal-title">
            <span>Edit</span>
            <span> {@sourceKeypath("currentAnimal.name")}</span>
          </h2>
        </div>
        <div className="modal-body">
          <form onSubmit={@handleWith("save", @sourceKeypath('currentAnimal'))}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="form-control" value={@sourceKeypath("currentAnimal.name")} onChange={@updateKeypath('currentAnimal.name')}/>
            </div>
            <div className="checkbox">
              <label>
                Can Fly?
                <input type="checkbox" className='checkbox' checked={@sourceKeypath("currentAnimal.canFly")} onChange={@updateKeypath('currentAnimal.canFly')}/>
              </label>
            </div>
            <div className='form-group'>
              {@enumerate('Animal.CLASSES', 'animalClass', (animalClass) ->
                return (
                  <label className='radio-inline'>
                    {animalClass}
                    <input type='radio' value={animalClass} checked={@sourceKeypath('currentAnimal.animalClass') == animalClass} onChange={@updateKeypath('currentAnimal.animalClass')} />
                  </label>
                  )
              )}
            </div>
            <div className='form-group'>
              <label>Color:</label>
              <select className='form-control' value={@sourceKeypath("currentAnimal.color")} onChange={@updateKeypath("currentAnimal.color")}>
                {@enumerate("Animal.COLORS", 'color', (color) ->
                  return <option key={color} value={color}>{color}</option>
                )}
              </select>
            </div>
            <input type="submit" value="Save" className="btn btn-success" />
          </form>
        </div>
        <div className="modal-footer">
          <button onClick={@handleWith("closeDialog")} className="btn">Close</button>
        </div>
      </div>
    )

