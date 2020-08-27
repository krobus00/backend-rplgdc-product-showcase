const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const {response, msg} = require('./helper/helper')
var cors = require('cors')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/public', express.static(__dirname + '/public'))
app.use(cors())

let routes = fs.readdirSync(__dirname + '/routes/api')
console.log(`Starting ${process.env.npm_package_name}`)
console.log('LOADING API ROUTE')
routes.forEach((route, i) => {
	try {
		const r = require(__dirname + '/routes/api/' + route)
		app.use('/api' + r.path, r.router)
		console.log(`${i + 1}. ${route} loaded`)
		console.log(`>[${r.path}] ${r.desc}`)
	} catch (error) {
		console.log(error)
		console.log(`${i + 1}. ${route} failed`)
	}
})
app.all('*', (req, res) => {
	return res.json(response(true,'TIDAK DITEMUKAN',{}))
})
app.listen(process.env.port, () => {
	console.log(`Server running http://localhost:${process.env.port}`)
})
