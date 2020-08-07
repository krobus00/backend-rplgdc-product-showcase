const db = require('../config/database')
const {response, msg} = require('../helper/helper')

const getRow = async () => {
	return new Promise((resolve, reject) => {
		db.query('SELECT COUNT(*) AS numrows FROM product', (err, results) => {
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
			return err || results.length > 0
				? taken
					? reject()
					: resolve()
				: taken
				? resolve()
				: reject()
		})
	})
}
const addProduct = (req, res) => {
	const user_id = req.info.user_id
	const {title, desc, type} = req.body
	const thumbnail = req.files.thumbnail[0].filename
	let location = req.body.location
	if (req.files.productData) location = req.files.productData[0].path
	db.query(
		'INSERT INTO product (product_id, user_id, product_title, product_thumbnail, product_desc, type_id, product_location, product_created, product_updated, product_deleted, product_banned, takedown_reason) VALUES (NULL, ?, ?, ?, ?, ?, ?, current_timestamp(), NULL, NULL, NULL, NULL)',
		[user_id, title, thumbnail, desc, type, location],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (req.files.media) {
				let media = []
				req.files.media.map((item) => {
					media.push([result.insertId, user_id, item.filename])
				})
				db.query(
					'INSERT INTO media (product_id, user_id, url) VALUES ?',
					[media],
					(err) => {
						if (err)
							return res.json(response(true, msg.failed, {error: err.code}))
						return res.json(
							response(false, 'Berhasil menambah produk baru', {}),
						)
					},
				)
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
		db.query(
			'SELECT * FROM PRODUCT WHERE takedown_reason IS NULL LIMIT ' +
				limit +
				' OFFSET ' +
				offset,
			async (err, results) => {
				if (err) return res.json(response(true, msg.failed, {error: err.code}))
				if (results.length == 0)
					return res.json(response(false, 'Produk tidak ada', {}))
				if (page > rows)
					return res.json(response(true, 'Halaman melebihi batas', {}))
				return res.json(
					response(false, '', {
						max_page: Math.ceil(rows / limit),
						current_page: page,
						products: results,
					}),
				)
			},
		)
	} catch (e) {
		return res.json(response(true, msg.failed, {error: e.code}))
	}
}
const listbyType = async (req, res) => {
	const {type} = req.params
	const limit = 10
	const page = req.query.page || 1
	const offset = (page - 1) * limit
	try {
		const rows = await getRow()
		db.query(
			'SELECT * FROM product p INNER JOIN type t on p.type_id = t.type_id WHERE t.type_title = ? LIMIT ' +
				limit +
				' OFFSET ' +
				offset,
			[type],
			(err, results) => {
				if (err) return res.json(response(true, msg.failed, {error: err.code}))
				if (results.length == 0)
					return res.json(response(false, 'Produk tidak ada', {}))
				if (page > rows)
					return res.json(response(true, 'Halaman melebihi batas', {}))
				return res.json(
					response(false, '', {
						max_page: Math.ceil(rows / limit),
						current_page: page,
						products: results,
					}),
				)
			},
		)
	} catch (e) {
		return res.json(response(true, msg.failed, {error: e.code}))
	}
}
const myProduct = (req, res) => {
	const {user_id} = req.info
	db.query(
		'SELECT * FROM product WHERE user_id = ? ',
		[user_id],
		(err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			return res.json(response(false, '', results))
		},
	)
}
const detailProduct = (req, res) => {
	const {username, product} = req.params
	db.query(
		'SELECT * FROM user, product WHERE product.user_id = user.user_id AND user.username = ? AND product.product_title = ?',
		[username, product],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (result[0].takedown_reason)
				return res.json(
					response(
						false,
						`Produk telah di ${result[0].product_banned ? 'banned' : 'hapus'}`,
						{
							reason: result[0].takedown_reason,
						},
					),
				)
			if (result.length > 0) {
				db.query(
					'SELECT * FROM media WHERE product_id = ?',
					[result[0].product_id],
					(err, results) => {
						if (err)
							return res.json(response(true, msg.failed, {error: err.code}))
						return res.json(
							response(false, '', {detail: result, media: results}),
						)
					},
				)
			} else {
				return res.json(response(false, 'PRODUCT TIDAK TERSEDIA', {}))
			}
		},
	)
}
const ownProduct = (req, res, next) => {
	const user_id = req.info.user_id
	db.query(
		'SELECT * FROM product WHERE user_id = ? AND product_id = ?',
		[user_id, req.body.product_id],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (result.length != 1)
				return res.json(response(false, 'ANDA TIDAK DIIZINKAN', {}))
			next()
		},
	)
}
const bannedProduct = (req, res) => {
	const {product_id, reason, banned} = req.body
	if (banned) {
		db.query(
			'UPDATE product SET product_banned = current_timestamp() , takedown_reason = ? WHERE product_id = ?',
			[reason, product_id],
			(err) => {
				if (err) return res.json(response(true, 'Gagal membanned product', {}))
				return res.json(response(false, 'Product telah terbanned', {}))
			},
		)
	} else {
		db.query(
			'UPDATE product SET product_banned = NULL , takedown_reason = NULL WHERE product_id = ?',
			[product_id],
			(err) => {
				if (err) return res.json(response(true, 'Gagal unbanned product', {}))
				return res.json(response(false, 'Product telah ter unbanned', {}))
			},
		)
	}
}
const deleteProduct = (req, res) => {
	const {product_id, reason} = req.body

	db.query(
		'UPDATE product SET product_deleted = current_timestamp() , takedown_reason = ? WHERE product_id = ?',
		[reason, product_id],
		(err) => {
			if (err) return res.json(response(true, 'Gagal menghapus product', {}))
			return res.json(response(false, 'Product telah terhapus', {}))
		},
	)
}
const downloadProduct = (req, res) => {
	let product = req.params.product
	db.query(
		'SELECT product_location FROM product WHERE product_title = ? AND takedown_reason IS NULL ',
		[product],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (result.length <= 0)
				return res.json(response(true, 'Produk tidak ditemukan', {}))
			return res.download(
				result[0].product_location,
				`${product}.${result[0].product_location.split('.').pop()}`,
			)
		},
	)
}
const deleteMedia = (req, res) => {
	const {media_id} = req.body
	const user_id = req.info.user_id
	db.query(
		'DELETE FROM media WHERE media_id = ? AND user_id = ?',
		[media_id, user_id],
		(err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (result.length == 1) return res.json(response(false, 'Berhasil', {}))
			return res.json(response(true, 'Media tidak ditemukan', {}))
		},
	)
}
const updateProductDetail = (req, res) => {
	let user_id = req.info.user_id
	const {title, desc, product_id} = req.body
	let location = ''
	let thumbnail = ''
	let queryValue = [title, desc]
	let queryUpdate = 'UPDATE asd SET product_title = ?, product_desc = ?'
	if (req.files.productData) location = req.files.productData[0].path
	if (req.files.thumbnail) thumbnail = req.files.thumbnail[0].path
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
				media.push([product_id, user_id, item.filename])
			})
			db.query(
				'INSERT INTO media (product_id, user_id, url) VALUES ?',
				[media],
				(err) => {
					if (err)
						return res.json(response(true, msg.failed, {error: err.code}))
					return res.json(response(false, 'Berhasil', {}))
				},
			)
		} else {
			return res.json(response(false, 'Berhasil', {}))
		}
	})
}
const search = async (req, res) => {
	const title = req.params.title
	const limit = 10
	const page = req.query.page || 1
	const offset = (page - 1) * limit
	try {
		const rows = await getRow()
		db.query(
			'SELECT * FROM product WHERE title LIKE %?% AND takedown_reason IS NULL LIMIT ' +
				limit +
				' OFFSET ' +
				offset,
			[title],
			(err, results) => {
				if (err) return res.json(response(true, msg.failed, {error: err.code}))
				if (results.length == 0)
					return res.json(response(false, 'Produk tidak ada', {}))
				if (page > rows)
					return res.json(response(true, 'Halaman melebihi batas', {}))
				return res.json(
					response(false, '', {
						max_page: Math.ceil(rows / limit),
						current_page: page,
						products: results,
					}),
				)
			},
		)
	} catch (e) {
		return res.json(response(true, msg.failed, {error: e.code}))
	}
}
module.exports = {
	checkTitle,
	list,
	myProduct,
	listbyType,
	ownProduct,
	detailProduct,
	addProduct,
	bannedProduct,
	deleteProduct,
	downloadProduct,
	deleteMedia,
	updateProductDetail,
	search,
}
