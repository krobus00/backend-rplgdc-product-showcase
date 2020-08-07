const express = require('express')
const app = express()
const fs = require('fs')
const bodyParser = require('body-parser')
const {response, msg} = require('./helper/helper')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))
app.get('/', (req, res) => res.send('Hello World!'))
let routes = fs.readdirSync(__dirname + '/routes')
console.log(`Starting ${process.env.npm_package_name}`)
console.log('LOADING ROUTES')
routes.forEach((route, i) => {
	try {
		const r = require(__dirname + '/routes/' + route)
		app.use(r.path, r.router)
		console.log(`${i + 1}. ${route} loaded`)
		console.log(`>[${r.path}] ${r.desc}`)
	} catch (error) {
		console.log(error)
		console.log(`${i + 1}. ${route} failed`)
	}
})
app.all('*', (req, res) => {
	res.status(404)
	return res.json(response(true, msg.not_found, {}))
})
app.listen(process.env.port, () => {
	console.log(`Server running http://localhost:${process.env.port}`)
})
