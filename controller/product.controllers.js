const db = require('../config/database')
const {response, msg} = require('../helper/helper')
const path = require('path')
const listProductByType = (type, page) => {
	const limit = 10
	page = page == 0 ? 1 : page
	const offset = (page - 1) * limit
	let query = 'SELECT product.*, type.type_title, user.username FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id '
	let value = []
	let countQuery = ''
	if (type != '*') {
		query += ' AND type.type_title = ?'
		countQuery = ` AND type.type_title = '${type}'`
		value.push(type)
	}
	query += ' order by product_created desc '
	query += ' LIMIT ' + limit + ' OFFSET ' + offset

	return new Promise(async (resolve, reject) => {
		try {
			const rows = await getRow(countQuery)
			db.query(query, value, (err, results) => {
				if (err) return reject(response(true, msg.failed, {error: err.code}))
				let maxPage = Math.ceil(rows / limit)
				if (results.length == 0) return resolve(response(false, 'Produk tidak ada', {}))
				if (page > maxPage) return resolve(response(true, 'Halaman melebihi batas', {}))
				return resolve(
					response(false, '', {
						max_page: maxPage,
						current_page: page,
						products: results,
					}),
				)
			})
		} catch (e) {
			return reject(response(true, msg.failed, {error: e.code}))
		}
	})
}
const listProductBySearch = (type, search, page) => {
	const limit = 10
	page = page == 0 ? 1 : page
	const offset = (page - 1) * limit
	let query = 'SELECT product.*, type.type_title, user.username FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id '
	let value = []
	let countQuery = ''
	if (type != 'all') {
		query += 'AND type.type_title = ?'
		countQuery += ` AND type.type_title = '${type}'`
		value.push(type)
	}
	query += ` AND product.product_title LIKE "%${search}%"`
	countQuery += ` AND product.product_title LIKE "%${search}%"`
	query += ' order by product_created desc '
	query += ' LIMIT ' + limit + ' OFFSET ' + offset
	return new Promise(async (resolve, reject) => {
		try {
			const rows = await getRow(countQuery)
			db.query(query, value, (err, results) => {
				if (err) return reject(response(true, msg.failed, {error: err.code}))
				let maxPage = Math.ceil(rows / limit)
				if (results.length == 0) return resolve(response(false, 'Produk tidak ditemukan', {}))
				if (page > maxPage) return resolve(response(true, 'Halaman melebihi batas', {}))
				return resolve(
					response(false, '', {
						max_page: maxPage,
						current_page: page,
						products: results,
					}),
				)
			})
		} catch (e) {
			return reject(response(true, msg.failed, {error: e.code}))
		}
	})
}
const getDetailProduct = (username, product) => {
	return new Promise((resolve, reject) => {
		db.query(
			'SELECT user.user_id, user.name,user.username, product.* , type.type_title, type.download FROM user, product, type WHERE product.user_id = user.user_id AND user.username = ? AND product.product_title = ? AND type.type_id = product.type_id',
			[username, product],
			(err, result) => {
				if (err) return reject(response(true, msg.failed, {error: err.code}))

				if (result.length > 0) {
					if (result[0].takedown_reason)
						return resolve(
							response(false, `Produk telah di ${result[0].product_banned ? 'banned' : 'hapus'}`, {
								reason: result[0].takedown_reason,
							}),
						)
					db.query('SELECT * FROM media WHERE product_id = ?', [result[0].product_id], (err, results) => {
						if (err) return reject(response(true, msg.failed, {error: err.code}))
						return resolve(response(false, '', {detail: result, media: results}))
					})
				} else {
					return resolve(response(true, 'PRODUK TIDAK TERSEDIA', {}))
				}
			},
		)
	})
}
const editPermission = (req, res, next) => {
	const user_id = req.info.user_id
	const product_id = req.params.id
	db.query('SELECT * FROM product WHERE user_id = ? AND product_id = ?', [user_id, product_id], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (result.length != 1) return res.json(response(false, 'ANDA TIDAK DIIZINKAN', {}))
		next()
	})
}
const getProductData = (user_id, product_id) => {
	return new Promise((resolve, reject) => {
		db.query('SELECT product.*, type.* FROM product, type WHERE product_id = ? AND product.type_id = type.type_id AND product_deleted IS NULL', [product_id], (err, result) => {
			if (err) return reject(response(true, msg.failed, {error: err.code}))
			if (result.length == 1) {
				if (result[0].user_id != user_id) return reject(response(true, msg.unauthorized, {}))
				resolve(result)
			} else {
				return reject(response(true, msg.failed, {}))
			}
		})
	})
}
const getMedia = (product_id) => {
	return new Promise((resolve, reject) => {
		db.query('SELECT * FROM media WHERE product_id = ?', [product_id], (err, results) => {
			if (err) return reject(response(true, msg.failed, {error: err.code}))
			resolve(results)
		})
	})
}
const getRow = (filter) => {
	return new Promise((resolve, reject) => {
		db.query('SELECT COUNT(*) AS numrows FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id ' + filter, (err, results) => {
			if (err) return reject(err)
			resolve(results[0].numrows)
		})
	})
}

const checkTitle = (title, taken, product_id) => {
	let query = 'SELECT * FROM product WHERE product_title = ?'
	if (product_id) query += ' AND product_id <> ' + product_id

	return new Promise((resolve, reject) => {
		db.query(query, [title], (err, results) => {
			return err || results.length > 0 ? (taken ? reject() : resolve()) : taken ? resolve() : reject()
		})
	})
}
const addProduct = (req, res) => {
	const user_id = req.info.user_id
	const {title, desc} = req.body
	let type = req.body.type
	if (isNaN(type)) type = `(SELECT type_id FROM type WHERE type.type_title = '${type}')`
	const thumbnail = req.files.thumbnail[0].filename
	let location = req.body.location || ''
	if (req.files.productData) location = req.files.productData[0].path
	db.query(
		`INSERT INTO product (product_id, user_id, product_title, product_thumbnail, product_desc, type_id, product_location, product_created, product_updated, product_deleted, product_banned, takedown_reason) VALUES (NULL, ?, ?, ?, ?, ${type}, ?, current_timestamp(), NULL, NULL, NULL, NULL)`,
		[user_id, title, thumbnail, desc, location],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (req.files.media) {
				let media = []
				req.files.media.map((item) => {
					media.push([result.insertId, user_id, path.parse(item.originalname).name, item.filename])
				})
				db.query('INSERT INTO media (product_id, user_id, media_title, url) VALUES ?', [media], (err) => {
					if (err) return res.json(response(true, msg.failed, {error: err.code}))
					return res.json(response(false, 'Berhasil menambah produk baru', {}))
				})
			} else {
				return res.json(response(false, 'Berhasil menambah produk baru', {}))
			}
		},
	)
}

const list = async (req, res) => {
	const limit = 10
	const page = req.query.page || 1
	const offset = (page - 1) * limit
	try {
		const rows = await getRow()
		db.query('SELECT * FROM PRODUCT WHERE takedown_reason IS NULL LIMIT ' + limit + ' OFFSET ' + offset, async (err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (results.length == 0) return res.json(response(false, 'Produk tidak ada', {}))
			if (page > rows) return res.json(response(true, 'Halaman melebihi batas', {}))
			return res.json(
				response(false, '', {
					max_page: Math.ceil(rows / limit),
					current_page: page,
					products: results,
				}),
			)
		})
	} catch (e) {
		return res.json(response(true, msg.failed, {error: e.code}))
	}
}
const listAllProduct = (req, res) => {
	db.query('SELECT product.*, type.type_title, user.username FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id order by product_created desc', (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))

		if (results.length == 0) return res.json(response(false, 'Produk tidak ada', {}))
		return res.json(
			response(false, '', {
				products: results,
			}),
		)
	})
}
const listAllProductByType = (req, res) => {
	const {type} = req.params
	db.query(
		'SELECT product.*, type.type_title, user.username FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id AND type.type_title = ? order by product_created desc ',
		[type],
		(err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (results.length == 0) return res.json(response(false, 'Produk tidak ada', {}))
			return res.json(
				response(false, '', {
					products: results,
				}),
			)
		},
	)
}
const listProductShowcase = (req, res) => {
	db.query(
		'SELECT * FROM product AS t1 JOIN (SELECT product_id FROM product WHERE takedown_reason IS NULL ORDER BY RAND() LIMIT 4) as t2 join (SELECT u.username, p.product_id FROM product as p JOIN user as u ON p.user_id = u.user_id) as t3 join (SELECT* FROM type) as t4 ON t1.product_id=t2.product_id AND t3.product_id = t2.product_id AND t1.type_id = t4.type_id',
		(err, results) => {
			if (err) return res.json(response(true, '', {error: err.code}))
			if (results.length == 0) return res.json(response(false, 'Produk tidak ada', {}))
			return res.json(response(false, '', {products: results}))
		},
	)
}
const listbyType = async (req, res) => {
	const {type} = req.params
	const limit = 10
	const page = req.query.page || 1
	const offset = (page - 1) * limit
	try {
		const rows = await getRow()
		db.query('SELECT * FROM product p INNER JOIN type t on p.type_id = t.type_id WHERE t.type_title = ? LIMIT ' + limit + ' OFFSET ' + offset, [type], (err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (results.length == 0) return res.json(response(false, 'Produk tidak ada', {}))
			if (page > rows) return res.json(response(true, 'Halaman melebihi batas', {}))
			return res.json(
				response(false, '', {
					max_page: Math.ceil(rows / limit),
					current_page: page,
					products: results,
				}),
			)
		})
	} catch (e) {
		return res.json(response(true, msg.failed, {error: e.code}))
	}
}
const detailProduct = (req, res) => {
	const {username, product} = req.params
	db.query(
		'SELECT user.user_id, user.name,user.username, product.* , type.type_title, type.download FROM user, product, type WHERE product.user_id = user.user_id AND user.username = ? AND product.product_title = ? AND type.type_id = product.type_id',
		[username, product],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (result.length == 1) {
				if (result[0].takedown_reason)
					return res.json(
						response(false, `Produk telah di ${result[0].product_banned ? 'banned' : 'hapus'}`, {
							reason: result[0].takedown_reason,
						}),
					)
				db.query('SELECT * FROM media WHERE product_id = ?', [result[0].product_id], (err, results) => {
					if (err) return res.json(response(true, msg.failed, {error: err.code}))
					return res.json(response(false, '', {detail: result, media: results}))
				})
			} else {
				return res.json(response(false, 'PRODUCT TIDAK TERSEDIA', {}))
			}
		},
	)
}
const myProduct = (req, res) => {
	const {user_id} = req.info
	db.query('SELECT * FROM product WHERE user_id = ? AND product_deleted IS NULL', [user_id], (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, '', {username: req.info.username, products: results}))
	})
}
const ownProduct = (req, res, next) => {
	const user_id = req.info.user_id
	db.query('SELECT * FROM product WHERE user_id = ? AND product_id = ?', [user_id, req.body.product_id], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (result.length != 1) return res.json(response(false, 'ANDA TIDAK DIIZINKAN', {}))
		next()
	})
}
const bannedProduct = (req, res) => {
	const {product_id, reason, banned} = req.body
	if (banned) {
		db.query('UPDATE product SET product_deleted = NULL, product_banned = current_timestamp() , takedown_reason = ? WHERE product_id = ?', [reason, product_id], (err) => {
			if (err) return res.json(response(true, 'Gagal membanned product', {}))
			return res.json(response(false, 'Product telah terbanned', {}))
		})
	} else {
		db.query('UPDATE product SET product_banned = NULL , takedown_reason = NULL WHERE product_id = ?', [product_id], (err) => {
			if (err) return res.json(response(true, 'Gagal unbanned product', {}))
			return res.json(response(false, 'Product telah ter unbanned', {}))
		})
	}
}

const deleteProduct = (req, res) => {
	const {product_id, reason} = req.body
	db.query('UPDATE product SET product_banned = NULL, product_deleted = current_timestamp() , takedown_reason = ? WHERE product_id = ?', [reason, product_id], (err) => {
		if (err) return res.json(response(true, 'Gagal menghapus product', {}))
		return res.json(response(false, 'Product telah terhapus', {}))
	})
}
const downloadProduct = (req, res) => {
	let product = req.params.product
	db.query('SELECT product_location FROM product WHERE product_title = ? AND takedown_reason IS NULL ', [product], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (result.length <= 0) return res.json(response(true, 'Produk tidak ditemukan', {}))
		return res.download(result[0].product_location, `${product}.${result[0].product_location.split('.').pop()}`)
	})
}
const deleteMedia = (req, res) => {
	const {media_id} = req.body
	const user_id = req.info.user_id
	db.query('DELETE FROM media WHERE media_id = ? AND user_id = ?', [media_id, user_id], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (result.affectedRows == 1) return res.json(response(false, 'Berhasil', {}))
		return res.json(response(true, 'Media tidak ditemukan', {}))
	})
}
const updateProductDetail = (req, res) => {
	let user_id = req.info.user_id
	const {title, desc, product_id} = req.body
	let location = ''
	let thumbnail = ''
	let queryValue = [title, desc]
	let queryUpdate = 'UPDATE product SET product_title = ?, product_desc = ?'
	if (req.files.productData) location = req.files.productData[0].path
	if (req.files.thumbnail) thumbnail = req.files.thumbnail[0].filename
	if (location) {
		queryValue.push(location)
		queryUpdate += ', product_location = ?'
	}
	if (thumbnail) {
		queryValue.push(thumbnail)
		queryUpdate += ', product_thumbnail = ?'
	}
	queryValue.push(product_id)
	db.query(queryUpdate + ' WHERE product_id = ?', queryValue, (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (req.files.media) {
			let media = []
			req.files.media.map((item) => {
				media.push([product_id, user_id, path.parse(item.originalname).name, item.filename])
			})
			db.query('INSERT INTO media (product_id, user_id, media_title, url) VALUES ?', [media], (err) => {
				if (err) return res.json(response(true, msg.failed, {error: err.code}))
				return res.json(response(false, 'Berhasil', {}))
			})
		} else {
			return res.json(response(false, 'Berhasil', {}))
		}
	})
}
const search = async (req, res) => {
	const {title, type} = req.params
	let query = `SELECT product.*, type.type_title, user.username FROM product,type,user WHERE takedown_reason IS NULL AND product.type_id = type.type_id AND user.user_id = product.user_id AND product.product_title LIKE "%${title}%" `
	if (type != 'all') query += ' AND type.type_title = ?'
	db.query(query, [type], (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (results.length == 0) return res.json(response(true, 'produk tidak ditemukan', {}))
		return res.json(response(false, '', {products: results}))
	})
}
module.exports = {
	checkTitle,
	list,
	listAllProduct,
	listAllProductByType,
	listProductShowcase,
	myProduct,
	listbyType,
	listProductByType,
	ownProduct,
	editPermission,
	detailProduct,
	getDetailProduct,
	addProduct,
	bannedProduct,
	deleteProduct,
	downloadProduct,
	deleteMedia,
	updateProductDetail,
	search,
	listProductBySearch,
	getProductData,
	getMedia,
}
