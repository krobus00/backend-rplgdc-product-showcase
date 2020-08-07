const db = require('../config/database')
const {response, msg} = require('../helper/helper')

const listProduct = (req, res) => {
	db.query('SELECT * FROM product', (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, msg.success, results))
	})
}
const listUser = (req, res) => {
	db.query('SELECT * FROM user', (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, msg.success, results))
	})
}
const dashboard = (req, res) => {
	let product = 0
	let user = 0
	db.query(
		'SELECT * FROM product WHERE takedown_reason IS NULL',
		(err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			product = results.length
		},
	)
	db.query('SELECT * FROM user', (err, results) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		user = results.length
	})
	return res.json(
		response(false, '', {
			jumlah_user: user,
			produk_aktif: product,
		}),
	)
}
const adminEditUser = (req, res) => {
	let {password, email, status, user_id} = req.body
	let value = [email, status]
	let query = 'UPDATE user SET email = ?, status = ?'
	if (req.files.avatar) {
		value.push(req.files.avatar[0].path)
		query += ' , photo = ? '
	}
	if (password) {
		password = md5(password)
		value.push(password)
		query += ' ,password = ? '
	}
	value.push(user_id)

	db.query(query + ' WHERE user_id = ?', value, (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, msg.success, {}))
	})
}
const deleteUser = (req, res) => {
	const {id} = req.query
	db.query('DELETE FROM user WHERE user_id = ?', [id], (err, result) => {
		if (err) return res.json(response(true, 'Gagal menghapus product', {}))
		if (result.affectedRows == 0)
			return res.json(response(true, 'id tidak ditemukan', {}))
		return res.json(response(false, 'User telah terhapus', {}))
	})
}
const deleteProduct = (req, res) => {
	const {id} = req.query
	db.query('DELETE FROM product WHERE product_id = ?', [id], (err, result) => {
		if (err) return res.json(response(true, 'Gagal menghapus product', {}))
		if (result.affectedRows == 0)
			return res.json(response(true, 'id tidak ditemukan', {}))
		return res.json(response(false, 'Product telah terhapus', {}))
	})
}
module.exports = {
	listProduct,
	listUser,
	deleteProduct,
	deleteUser,
	dashboard,
	adminEditUser,
}
