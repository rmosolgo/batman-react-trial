Batman.View.store.set('/animals/detail', '<p>\n  These details about&nbsp;\n  <span data-bind=\'animal.name\'></span>\n  &nbsp;were loaded from a different HTML file:\n  <ul data-context=\'animal\'>\n    <li data-bind=\'canFly | default \"Not selected\" | prepend \"Can Fly: \"\'></li>\n    <li data-bind=\'color | default \"Not selected\" | prepend \"Color: \"\'></li>\n    <li data-bind=\'animalClass | default \"Not selected\"\'></li>\n  </ul>\n</p>');
Batman.View.store.set('/animals/edit', '<div>\n  <div class=\"modal-header\">\n    <h2 class=\"modal-title\">\n      <span>Edit </span>\n      <span data-bind=\"currentAnimal.name\"></span>\n    </h2>\n  </div>\n  <div class=\"modal-body\">\n    <form data-event-submit=\"save | withArguments currentAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'currentAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>Name</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\"currentAnimal.name\"/>\n      </div>\n      <div class=\"checkbox\">\n        <label>\n          Can Fly?\n          <input type=\"checkbox\" class=\'checkbox\' data-bind=\'currentAnimal.canFly\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label data-foreach-animalclass=\'Animal.CLASSES\' class=\'radio-inline\'>\n          <span data-bind=\'animalclass\'></span>\n          <input type=\'radio\' data-bind-value=\'animalclass\' data-bind=\'currentAnimal.animalClass\' />\n        </label>\n      </div>\n      <div class=\'form-group\'>\n        <label>Color:</label>\n        <select class=\'form-control\' data-bind=\"currentAnimal.color\">\n          <option value=\'\'>Pick a color</option>\n          <option data-foreach-color=\'Animal.COLORS\' data-bind-value=\'color\' data-bind=\'color\'></option>\n        </select>\n      </div>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-success\" />\n    </form>\n  </div>\n  <div class=\"modal-footer\">\n    <button data-event-click=\'closeDialog\' class=\"btn\">Close</button>\n  </div>\n</div>');
Batman.View.store.set('/animals/index', '<h1>\n  All Animals\n  <small> (<span data-bind=\'\"Animal\" | pluralize animals.length\'></span>)</small>\n</h1>\n<ul class=\"list-unstyled\">\n  <li data-foreach-animal=\'animals\'>\n    <div class=\"row\">\n      <div class=\"col-xs-4\" data-context-canfly=\'animal.canFly\'>\n        <a data-route=\"routes.animals[animal]\">\n          <p class=\"lead text-warning\"\n            data-removeclass-text-warning=\'canfly\'\n            data-addclass-text-success=\'canfly\'\n            data-addclass-text-danger=\'canfly | not\'\n            >\n            <span data-bind=\'animal.name\'></span>\n            <span class=\"text-muted\" data-showif=\'animal.canFly\'> (can fly)</span>\n            <span class=\"text-muted\" data-hideif=\'animal.canFly\'> (can\'t fly)</span>\n            &mdash;\n            <span class=\"text-muted\" data-showif=\'canfly\'> (can fly ctx)</span>\n            <span class=\"text-muted\" data-hideif=\'canfly\'> (can\'t fly ctx)</span>\n          </p>\n        </a>\n      </div>\n      <div class=\"col-xs-4\">\n        <small data-showif=\'animal.color\' data-bind=\"animal.color | upcase | append \' \'\"></small>\n        <small data-bind=\"animal.animalClass | upcase\"></small>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'executeAction | withArguments \"edit\", animal\' class=\"btn\">Edit in Dialog</button>\n      </div>\n      <div class=\"col-xs-2\">\n        <button data-event-click=\'destroy | withArguments animal\' class=\"btn btn-danger\">Destroy</button>\n      </div>\n    </div>\n  </li>\n</ul>\n<div data-partial=\'\"animals/new_form\"\'></div>\n');
Batman.View.store.set('/animals/new_form', '<p class=\"row\">\n  <div class=\"well\">\n    <form data-formfor-animal=\'newAnimal\' data-event-submit=\"save | withArguments newAnimal\">\n      <ul class=\'list-unstyled\'>\n        <li class=\'alert alert-danger\' data-foreach-error=\'newAnimal.errors\'>\n          <span data-bind=\'error.fullMessage\'></span>\n        </li>\n      </ul>\n      <div class=\"form-group\">\n        <label>New Animal:</label>\n        <input type=\"text\" class=\"form-control\" data-bind=\'newAnimal.name\'/>\n      </div>\n      <p>\n        Make a new animal:\n        <span data-bind=\"Animal.NAMES | join \', \' | prepend \' \' \"></span>\n      </p>\n      <input type=\"submit\" value=\"Save\" class=\"btn btn-primary\"/>\n    </form>\n  </div>\n</p>');
Batman.View.store.set('/animals/show', '<div>\n  <h1 data-bind=\'animal.name\'></h1>\n  <p data-showif=\'animal.animalClass | eq \"Mammal\"\'>\n    Mammalian\n  </p>\n  <p data-showif=\'animal.animalClass | eq \"Reptile\"\'>\n    Reptilian\n  </p>\n  <p>I put this page here to test data-route bindings.</p>\n  <p style=\'font-weight: 800;\' data-style-font-size=\'animal.fontSize\' data-style-color=\'animal.color\'>\n    This font-size is bound to <code>animal.name</code>.\n  </p>\n  <div data-partial=\'\"animals/detail\"\'></div>\n  <p>\n    <a data-route=\'routes.animals\' class=\'btn btn-primary\'>Go back</a>\n  </p>\n</div>');