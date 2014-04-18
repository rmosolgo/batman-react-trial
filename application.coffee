Batman.config.pathToApp = window.location.pathname

class @App extends Batman.App
  @root 'animals#index'

  @on 'run', ->
    @_seedData()
    Batman.redirect("/")

  # Just to make things interesting, make some Animals
  @_seedData: ->
    totalAnimals = App.Animal.get('all.length')
    if totalAnimals is 0
      for n in ["Hedgehog", "Starfish", "Echidna"]
        animal = new App.Animal(name: n)
        animal.save()

$ -> App.run()

class App.ApplicationController extends Batman.Controller
  openDialog: ->
    $('.modal').modal('show')

  closeDialog: ->
    $('.modal').modal('hide')
    modalYield = Batman.DOM.Yield.get('yields.modal')
    modalYield.get('contentView')?.die()
    modalYield.set('contentView', undefined)

  @beforeAction @::closeDialog

  dialog: (renderOptions={}) ->
    opts = Batman.extend({into: "modal"}, renderOptions)
    view = @render(opts).on 'ready', =>
      @openDialog()

class App.AnimalsController extends App.ApplicationController
  routingKey: 'animals'

  index: (params) ->
    @set 'newAnimal', new App.Animal

  edit: (animal) ->
    @set 'currentAnimal', animal
    @dialog()
class App.Animal extends Batman.Model
  @resourceName: 'animal'
  @persist Batman.LocalStorage
  @encode 'name'

class App.AnimalsIndexView extends Batman.View
  saveAnimal: (animal) ->
    animal.save (err, r) =>
      @set('newAnimal', new App.Animal)

  destroyAnimal: (animal) -> animal.destroy()

class App.AnimalsEditView extends Batman.View
  saveAnimal: (animal) ->
    animal.save ->
      Batman.redirect("/")
