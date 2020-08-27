const db = require('../config/database')
const {response, msg} = require('../helper/helper')

const list = (req, res) => {
	db.query('SELECT * FROM type', (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(
			response(false, msg.success, {
				type: results,
			}),
		)
	})
}
const info = (req, res) => {
	const {type} = req.params
	db.query('SELECT * FROM type WHERE type_title = ?', [type], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (result.length == 0) return res.json(response(true, 'Tipe produk tidak ditemukan', {}))
		return res.json(response(false, '', result))
	})
}
const listByCategory = (req, res) => {
	db.query('SELECT product_title, product_desc,product_type FROM product p JOIN product_category pc ON pc.product_id = p.product_id JOIN category c ON c.category_id = pc.category_id WHERE c.category = ?', [req.params.cat], (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, msg.success, results))
	})
}
const add = (req, res) => {
	const category = req.body.category
	db.query('SELECT * FROM category WHERE category = ?', [category], (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		if (results.length > 0) return res.json(response(true, 'Category sudah ada', {}))
		db.query('INSERT INTO category (category_id, category) VALUES (NULL, ?)', [category], (err, result) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			return res.json(response(false, msg.success, {}))
		})
	})
}
module.exports = {
	list,
	info,
	listByCategory,
	add,
}
