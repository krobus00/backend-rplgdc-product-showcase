const {param, query, validationResult, body} = require('express-validator')
const {
	checkNIM,
	checkUsername,
	checkEmail,
} = require('../controller/user.controllers')
const {checkTitle} = require('../controller/product.controllers')
const {response} = require('./helper')
const fs = require('fs')
const deleteFile = (req) => {
	for (key in req.files) {
		req.files[key].forEach((element) => {
			fs.unlink(element.path, (err) => {
				if (err) {
					console.error(err)
				}
			})
		})
	}
}
const errorFilter = (req) => {
	const errors = validationResult(req)
	let err = []
	errors.errors.map((item) => {
		if (item.msg != 'Invalid value') err.push(item)
	})
	return err
}
const register = [
	body('name')
		.exists()
		.matches(/^[a-zA-Z ]*$/)
		.withMessage('Nama tidak boleh mengandung angka')
		.isLength({min: 5, max: 30}),
	body('username')
		.exists()
		.custom(async (username, {req}) => {
			await checkUsername(username, true, req.body.user_id)
		})
		.withMessage('Username sudah digunakan')
		.isLength({min: 4, max: 12})
		.withMessage('Username harus 4 - 12 karakter'),
	body('nim')
		.exists()
		.matches(/^[0-9]*$/)
		.withMessage('format nim salah')
		.custom(async (nim, {req}) => {
			await checkNIM(nim, true, req.body.user_id)
		})
		.withMessage('NIM sudah digunakan')
		.isLength({min: 10, max: 10})
		.withMessage('NIM salah'),
	body('password').exists().isLength({min: 6, max: 12}),
	body('email')
		.exists()
		.isEmail()
		.normalizeEmail()
		.custom(async (email, {req}) => {
			await checkEmail(email, true, req.body.user_id)
		})
		.withMessage('Email sudah digunakan'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		next()
	},
]
const login = [
	body('username')
		.exists()
		.custom(async (username) => {
			await checkUsername(username, false)
		})
		.withMessage('Username tidak ditemukan')
		.isLength({min: 4, max: 12})
		.withMessage('Username harus 4 - 12 karakter'),
	body('password').exists().isLength({min: 6, max: 12}),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		next()
	},
]
const editProfile = [
	body('email')
		.exists()
		.isEmail()
		.normalizeEmail()
		.custom(async (email, {req}) => {
			await checkEmail(email, true, req.info.user_id)
		})
		.withMessage('Email sudah digunakan'),
	body('password').optional().isLength({min: 6, max: 12}),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		next()
	},
]
const adminEditUser = [
	body('user_id').exists().withMessage('id user harus ada'),
	body('email')
		.exists()
		.isEmail()
		.normalizeEmail()
		.custom(async (email, {req}) => {
			await checkEmail(email, true, req.body.user_id)
		})
		.withMessage('Email sudah digunakan'),
	body('password').optional().isLength({min: 6, max: 12}),
	body('status').exists().withMessage('status harus ada'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		next()
	},
]
const category = [
	body('category')
		.exists()
		.matches(/^[a-zA-Z ]*$/),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		next()
	},
]
const addProduct = [
	body('title')
		.exists()
		.custom(async (title) => {
			await checkTitle(title, true, '')
		})
		.withMessage('Judul sudah digunakan')
		.isLength({min: 1, max: 32})
		.withMessage('title harus 1 - 32 karakter'),
	body('desc').exists().isLength({min: 5}),
	body('type').exists(),
	body('location').exists(),
	(req, res, next) => {
		err = errorFilter(req)
		if (!req.files.thumbnail) {
			err.push({
				value: '',
				msg: 'Thumbnail harus dipilih',
				param: 'thumbnail',
				location: 'files',
			})
		}
		if (err.length > 0) {
			deleteFile(req)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		}
		next()
	},
]
const detailProduct = [
	param('username')
		.exists()
		.custom(async (username) => {
			await checkUsername(username, false)
		})
		.withMessage('Username tidak ditemukan'),
	param('product').exists(),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const searchProduct = [
	param('title').exists().withMessage('Judul product tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const listbyType = [
	param('type').exists().withMessage('Judul product tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const deleteProduct = [
	body('product_id').exists().withMessage('id produk tidak boleh kosong'),
	body('reason').exists().withMessage('Alasan penghapusan produk harus ada'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const completelyDeleteProduct = [
	query('id').exists().withMessage('id produk tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const deleteUser = [
	query('id').exists().withMessage('id user tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const deleteMedia = [
	body('media_id').exists().withMessage('id media tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0)
			return res.json(response(true, 'Alamat website salah!', {error: err}))
		next()
	},
]
const updateProduct = [
	body('title')
		.exists()
		.custom(async (title, {req}) => {
			await checkTitle(title, true, req.body.product_id)
		})
		.withMessage('Judul sudah digunakan')
		.isLength({min: 1, max: 32})
		.withMessage('title harus 1 - 32 karakter'),
	body('desc').exists().isLength({min: 5}),
	body('type').exists(),
	body('location').exists(),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) {
			deleteFile(req)
			return res.json(response(true, 'Data tidak lengkap!', {error: err}))
		}
		next()
	},
]
module.exports = {
	register,
	login,
	editProfile,
	adminEditUser,
	category,
	addProduct,
	detailProduct,
	searchProduct,
	listbyType,
	deleteProduct,
	deleteUser,
	completelyDeleteProduct,
	deleteMedia,
	updateProduct,
}
