const desc = 'Base controller'
const path = '/base'
const express = require('express')
const router = express.Router()
router.get('/base', (req, res) => {
	return res.send('base page')
})
module.exports = {
	router,
	desc,
	path,
}
