var register = function (Handlebars) {
	var helpers = {
		ifvalue: function (conditional, options) {
			if (options.hash.value === conditional) {
				return options.fn(this)
			} else {
				return options.inverse(this)
			}
		},
	}

	if (Handlebars && typeof Handlebars.registerHelper === 'function') {
		for (var prop in helpers) {
			Handlebars.registerHelper(prop, helpers[prop])
		}
	} else {
		return helpers
	}
}

module.exports.register = register
module.exports.helpers = register(null)
