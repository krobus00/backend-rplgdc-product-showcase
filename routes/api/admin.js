const desc = 'Routing khusus admin'
const path = '/admin'
const express = require('express')
const router = express.Router()
const {authToken, permit} = require('../../middleware/auth')
const product = require('../../controller/product.controllers')
const admin = require('../../controller/admin.controllers')
const validate = require('../../helper/validator')
const {upload} = require('../../middleware/upload')
router.use(authToken, permit('admin'))
router.get('/dashboard', admin.dashboard)
router.put('/banned', validate.deleteProduct, product.bannedProduct)
router.put('/deleteproduct', validate.deleteProduct, product.deleteProduct)
router.delete('/deleteproduct', validate.completelyDeleteProduct, admin.deleteProduct)
router.put('/undelete', validate.undeleteProduct, admin.undeleteProduct)
router.get('/listproduct', admin.getListProduct)
router.get('/listuser', admin.getListUser)
router.put('/changestatus', admin.changeUserStatus)
router.delete('/deleteuser', validate.deleteUser, admin.deleteUser)
module.exports = {
	router,
	desc,
	path,
}
