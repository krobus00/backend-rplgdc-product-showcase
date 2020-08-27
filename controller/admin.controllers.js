const db = require('../config/database')
const {response, msg} = require('../helper/helper')

const listProduct = async (limit) => {
	return new Promise((resolve, reject) => {
		db.query('SELECT product.*, user.username, type.type_title FROM product,user,type WHERE product.user_id = user.user_id AND product.type_id = type.type_id order by product_created desc', (err, results) => {
			if (err) reject(response(true, msg.failed, {error: err.code}))
			return resolve({
				total: results.length,
				data: limit ? results.slice(0, 5) : results,
			})
		})
	})
}
const listUser = async (limit, id) => {
	return new Promise((resolve, reject) => {
		db.query(`SELECT * FROM user ${id ? 'WHERE user_id != ' + id : ''} order by create_at desc`, (err, results) => {
			if (err) reject(response(true, msg.failed, {error: err.code}))
			return resolve({
				total: results.length,
				data: limit ? results.slice(0, 5) : results,
			})
		})
	})
}
const listType = async () => {
	return new Promise((resolve, reject) => {
		db.query('SELECT * FROM type', (err, results) => {
			if (err) reject(response(true, msg.failed, {error: err.code}))
			return resolve({
				total: results.length,
			})
		})
	})
}
const getListProduct = async (req, res) => {
	try {
		let list = await listProduct(false)
		return res.json(response(false, '', list.data))
	} catch (e) {
		return res.json(e)
	}
}
const getListUser = async (req, res) => {
	try {
		let list = await listUser(false, req.info.user_id)
		return res.json(response(false, '', list.data))
	} catch (e) {
		return res.json(e)
	}
}
const dashboard = async (req, res) => {
	try {
		let users = await listUser(true, '')
		let products = await listProduct(true)
		let types = await listType()
		return res.json(
			response(false, '', {
				products: products,
				users: users,
				types: types,
			}),
		)
	} catch (e) {
		res.json(response(true, e.code, {}))
	}
}
const changeUserStatus = (req, res) => {
	let {user_id, status} = req.body
	db.query('UPDATE user SET status = ? WHERE user_id = ?', [status, user_id], (err, result) => {
		if (err) return res.json(response(true, msg.failed, {error: err.code}))
		return res.json(response(false, msg.success, {}))
	})
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
		if (err) return res.json(response(true, 'Gagal menghapus user', {}))
		if (result.affectedRows == 0) return res.json(response(true, 'id tidak ditemukan', {}))
		return res.json(response(false, 'User telah terhapus', {}))
	})
}
const deleteProduct = (req, res) => {
	const {product_id} = req.body
	db.query('DELETE FROM product WHERE product_id = ?', [product_id], (err, result) => {
		if (err) return res.json(response(true, 'Gagal menghapus product', {}))
		if (result.affectedRows == 0) return res.json(response(true, 'id tidak ditemukan', {}))
		return res.json(response(false, 'Product telah terhapus', {}))
	})
}
const undeleteProduct = (req, res) => {
	const {product_id} = req.body
	db.query('UPDATE product SET product_deleted = NULL WHERE product_id = ?', [product_id], (err) => {
		if (err) return res.json(response(true, 'Gagal mengembalikan produk', {}))
		return res.json(response(false, 'Product berhasil dikembalikan', {}))
	})
}
module.exports = {
	getListUser,
	getListProduct,
	deleteProduct,
	undeleteProduct,
	deleteUser,
	dashboard,
	adminEditUser,
	changeUserStatus,
}
