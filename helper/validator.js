const {param, query, validationResult, body} = require('express-validator')
const {checkNIM, checkUsername, checkEmail} = require('../controller/user.controllers')
const {checkTitle} = require('../controller/product.controllers')
const {response, msg} = require('./helper')
const fs = require('fs')
const path = require('path')
var DecompressZip = require('decompress-zip')
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
	let extractedErrors = []
	errors.array({onlyFirstError: true}).map((err) => {
		extractedErrors.push({param: err.param, msg: err.msg})
	})
	return extractedErrors
}
const register = [
	body('name')
		.exists()
		.withMessage('Nama harus diisi')
		.matches(/^[a-zA-Z ]*$/)
		.withMessage('Nama tidak boleh mengandung angka')
		.isLength({min: 5, max: 30}),
	body('username')
		.exists()
		.custom(async (username, {req}) => {
			await checkUsername(username, true, req.body.user_id)
		})
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
		.withMessage('Format nim salah'),
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
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
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
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
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
	body('oldpassword').isLength({min: 6, max: 12}).optional({nullable: true, checkFalsy: true}),
	body('password').isLength({min: 6, max: 12}).optional({nullable: true, checkFalsy: true}),
	body('cpassword').isLength({min: 6, max: 12}).optional({nullable: true, checkFalsy: true}),
	(req, res, next) => {
		if (req.body.cpassword != req.body.password) {
			err.push({
				value: '',
				msg: 'Password tidak sama',
				param: 'cpassword',
				location: 'body',
			})
		}
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
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
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const category = [
	body('category')
		.exists()
		.matches(/^[a-zA-Z ]*$/),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
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
		.isLength({min: 5, max: 37})
		.withMessage('title harus 5 - 37 karakter'),
	body('desc').exists().isLength({min: 5}).withMessage('deskripsi produk terlalu pendek'),
	body('type').exists(),
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
		if (!req.body.location && !req.files.productData && !req.body.nodata) {
			err.push({
				value: '',
				msg: 'Lokasi/file produk harus diisi',
				param: 'location',
				location: 'body',
			})
		}
		if (req.body.nodata && !req.files.media) {
			err.push({
				value: '',
				msg: 'Media produk harus diisi',
				param: 'media',
				location: 'body',
			})
		}
		if (req.files.productData) {
			if (req.files.productData[0].mimetype == 'application/x-zip-compressed') {
				var filepath = path.join(req.files.productData[0].destination, req.files.productData[0].filename)
				const extractPath = path.join(req.files.productData[0].destination, path.parse(req.files.productData[0].filename).name)

				var unziper = new DecompressZip(filepath)
				unziper.on('extract', function () {
					fs.unlink(filepath, (err) => {
						if (err) {
							console.error(err)
						}
					})
					if (err.length > 0) {
						deleteFile(req)
						return res.json(response(true, msg.errValidation, {error: err}))
					}
					req.files.productData[0].path = extractPath
					next()
				})
				unziper.on('error', function (err) {
					err.push({
						value: '',
						msg: 'Gagal mengextract file game',
						param: 'location',
						location: 'body',
					})
				})
				unziper.extract({
					path: extractPath,
					filter: function (file) {
						return file.type !== 'SymbolicLink'
					},
				})
			} else {
				if (err.length > 0) {
					deleteFile(req)
					return res.json(response(true, msg.errValidation, {error: err}))
				}
				next()
			}
		} else {
			if (err.length > 0) {
				deleteFile(req)
				return res.json(response(true, msg.errValidation, {error: err}))
			}
			next()
		}
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
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const searchProduct = [
	param('type').exists().withMessage('Tipe produk tidak boleh kosong'),
	param('title').exists().withMessage('Judul produk tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const listbyType = [
	param('type').exists().withMessage('Judul product tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const deleteProduct = [
	body('product_id').isInt().withMessage('id produk tidak boleh kosong'),
	body('reason').exists().isLength({min: 5}).withMessage('Alasan penghapusan produk harus ada'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const undeleteProduct = [
	body('product_id').exists().withMessage('id produk tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const completelyDeleteProduct = [
	body('product_id').exists().withMessage('id produk tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const deleteUser = [
	query('id').exists().withMessage('id user tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
		next()
	},
]
const deleteMedia = [
	body('media_id').exists().withMessage('id media tidak boleh kosong'),
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) return res.json(response(true, msg.errValidation, {error: err}))
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
	(req, res, next) => {
		err = errorFilter(req)
		if (err.length > 0) {
			deleteFile(req)
			return res.json(response(true, msg.errValidation, {error: err}))
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
	undeleteProduct,
}
