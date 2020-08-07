const desc = 'Routing khusus admin'
const path = '/admon'
const express = require('express')
const router = express.Router()
const {authToken, permit} = require('../middleware/auth')
const product = require('../controller/product.controllers')
const admin = require('../controller/admin.controllers')
const validate = require('../helper/validator')
const {upload} = require('../middleware/upload')
router.use(authToken, permit('admin'))
router.get('/dashboard', admin.dashboard)
router.put('/banned', validate.deleteProduct, product.bannedProduct)
router.put('/deleteproduct', validate.deleteProduct, product.deleteProduct)
router.delete(
	'/deleteproduct',
	validate.completelyDeleteProduct,
	admin.deleteProduct,
)
router.get('/listproduct', admin.listProduct)
router.get('/listuser', admin.listUser)
router.put('/edituser', upload, validate.adminEditUser, admin.adminEditUser)
router.delete('/deleteuser', validate.deleteUser, admin.deleteUser)

module.exports = {
	router,
	desc,
	path,
}
