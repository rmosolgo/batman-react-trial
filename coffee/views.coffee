class App.AnimalsIndexView extends Batman.View
  saveAnimal: (animal) ->
    animal.save (err, r) =>
      @set('newAnimal', new App.Animal)

  destroyAnimal: (animal) -> animal.destroy()

class App.AnimalsEditView extends Batman.View
  saveAnimal: (animal) ->
    animal.save ->
      Batman.redirect("/")
