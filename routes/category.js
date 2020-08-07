const desc = 'Routing category'
const path = '/category'
const express = require('express')
const router = express.Router()

const {authToken, permit} = require('../middleware/auth')
const validate = require('../helper/validator')
const category = require('../controller/category.controllers')
router.get('/list', category.list)
router.get('/productcategory/:cat', category.listByCategory)
router.post('/add', authToken, validate.category, category.add)
module.exports = {
	router,
	desc,
	path,
}
