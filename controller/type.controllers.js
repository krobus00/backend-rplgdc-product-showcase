const db = require('../config/database')
const {response, msg} = require('../helper/helper')

const getType = () => {
	return new Promise((resolve, reject) => {
		db.query('SELECT * FROM type', (err, results) => {
			if (!err) resolve(response(false, '', results))
			reject(response(true, msg.server, {}))
		})
	})
}
module.exports = {
	getType,
}
