const mysql = require('mysql')
const db_config = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'game',
}
const con = mysql.createConnection(db_config)
con.connect((err) => {
	if (err) {
		console.log('error connecting to database:' + err.stack)
	}
})

module.exports = con
