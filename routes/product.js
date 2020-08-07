const desc = 'Routing product'
const path = '/product'
const express = require('express')
const router = express.Router()
const product = require('../controller/product.controllers')
const {authToken} = require('../middleware/auth')
const {upload} = require('../middleware/upload')
const validate = require('../helper/validator')
const {ownProduct} = require('../controller/product.controllers')

router.post(
	'/addproduct',
	authToken,
	upload,
	validate.addProduct,
	product.addProduct,
)
router.put(
	'/update',
	authToken,
	upload,
	ownProduct,
	validate.updateProduct,
	product.updateProductDetail,
)
router.put(
	'/delete',
	authToken,
	ownProduct,
	validate.deleteProduct,
	product.deleteProduct,
)
router.get('/list/:type', validate.listbyType, product.listbyType)
router.get('/list', product.list)
router.get('/myproduct', authToken, product.myProduct)
router.get('/search/:title', validate.searchProduct, product.search)
router.get('/:username/:product', validate.detailProduct, product.detailProduct)
router.get(
	'/:username/:product/download',
	validate.detailProduct,
	product.downloadProduct,
)
router.delete(
	'/media',
	authToken,
	ownProduct,
	validate.deleteMedia,
	product.deleteMedia,
)
module.exports = {
	router,
	desc,
	path,
}
