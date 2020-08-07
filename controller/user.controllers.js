const db = require('../config/database')
const {response, msg} = require('../helper/helper')
require('dotenv').config()
const jwt = require('jsonwebtoken')
var md5 = require('md5')
const {query} = require('express')

/**
 *
 * @param {string} nim nim untuk mengenerate token
 * @param {number} user_id id dari user yang akan digenerate
 */
const generateToken = (nim, user_id) => {
	return jwt.sign({user_id: user_id, nim: nim}, process.env.ACCESS_TOKEN)
}

/**
 *
 * @param {int} user_id id yang akan dicek statusnya
 */
const checkStatus = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			`SELECT status FROM user WHERE user_id = ?`,
			[user_id],
			(err, results) => {
				if (!err) resolve(results[0].status)
				reject(response(true, msg.server, {}))
			},
		)
	})
}
/**
 *
 * @param {string} nim nim yang akan dicek
 * @param {boolean} taken mengecek apakah nim tersebut ada di database
 * @param {number} user_id id dari user jika ada
 */
const checkNIM = (nim, taken, user_id) => {
	let query = 'SELECT * FROM user WHERE nim = ?'
	if (user_id) query += ' AND user_id <> ' + user_id
	return new Promise((resolve, reject) => {
		db.query(query, [nim], (err, results) => {
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
const checkUsername = (username, taken, user_id) => {
	let query = 'SELECT * FROM user WHERE username = ?'
	if (user_id) query += ' AND user_id <> ' + user_id
	return new Promise((resolve, reject) => {
		db.query(query, [username], (err, results) => {
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
const checkEmail = (email, taken, user_id) => {
	let query = 'SELECT * FROM user WHERE email = ?'
	if (user_id) query += ' AND user_id <> ' + user_id
	return new Promise((resolve, reject) => {
		db.query(query, [email], (err, results) => {
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
/**
 *
 * @param {number} user_id id user yang akan diambil namanya
 */
const getName = (user_id) => {
	return new Promise((resolve, reject) => {
		db.query(
			'SELECT * FROM user WHERE user_id = ?',
			[user_id],
			(err, results) => {
				if (err) return reject(response(true, msg.server, {}))
				return resolve(results[0].name)
			},
		)
	})
}
/**
 *
 * @param {number} id id user
 * @param {string} token token yang telah dibuat
 */
const addTokenList = async (id, token, res) => {
	return new Promise(async (resolve, reject) => {
		try {
			const status = await checkStatus(id)
			db.query(
				'INSERT INTO token (token_id, user_id, token, create_at) VALUES (NULL, ?, ?, current_timestamp())',
				[id, token],
				(err) => {
					if (err) return reject(response(true, msg.server, {}))
					return resolve(
						response(false, msg.success, {
							status: status,
							accessToken: token,
						}),
					)
				},
			)
		} catch (e) {
			return reject(response(true, msg.server, {}))
		}
	})
}
const getTokenList = (id) => {
	return new Promise((resolve, reject) => {
		db.query('SELECT * FROM token WHERE user_id = ?', [id], (err, results) => {
			if (err)
				return reject(
					response(true, 'terjadi kesalahan pada database server', {}),
				)
			return resolve(results)
		})
	})
}

const register = async (req, res) => {
	const {name, username, nim, email, password} = req.body
	const status = 'member'
	db.query(
		'INSERT INTO user (user_id, name, username, nim, photo, password, email, status, create_at, update_at) VALUES (NULL, ?, ?, ?, NULL, ?, ?, ?, current_timestamp(), NULL)',
		[name, username, nim, md5(password), email, status],
		(err) => {
			if (err) return res.json(response(true, msg.failed, {}))
			return res.json(response(false, msg.success, {}))
		},
	)
}

const login = async (req, res) => {
	const {nim, username} = req.body
	const password = md5(req.body.password)
	db.query(
		'SELECT * FROM user WHERE nim = ? OR username = ? AND password = ?',
		[nim, username, password],
		async (err, results) => {
			if (err) return res.json(response(true, msg.failed, {error: err.code}))
			if (results.length > 0) {
				try {
					const accessToken = generateToken(nim, results[0].user_id)
					return res.json(await addTokenList(results[0].user_id, accessToken))
				} catch (e) {
					return res.json(response(true, msg.failed, {error: e}))
				}
			} else {
				return res.json(response(true, 'Akun tidak ditemukan!', {}))
			}
		},
	)
}
const editProfile = (req, res) => {
	const {user_id} = req.info
	let {password, email} = req.body
	let value = [email]
	let query = 'UPDATE user SET email = ?'
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
const logout = (req, res) => {
	const authHeader = req.headers['authorization']
	const token = authHeader.split(' ')[1]
	if (token == null) return res.json(response(true, msg.unauthorized, {}))
	jwt.verify(token, process.env.ACCESS_TOKEN, (err) => {
		if (err) return res.json(response(true, msg.unauthorized, {}))
		db.query(`DELETE FROM token WHERE token = ?`, [token], (err, results) => {
			if (err || results.affectedRows == 0) {
				return res.json(
					response(true, 'Terjadi kesalahan saat proses logout.', {}),
				)
			} else {
				return res.json(response(false, 'Berhasil logout', {}))
			}
		})
	})
}
const logoutAll = (req, res) => {
	const authHeader = req.headers['authorization']
	const token = authHeader.split(' ')[1]
	const {user_id} = req.info
	if (token == null) return res.json(response(true, msg.unauthorized, {}))
	jwt.verify(token, process.env.ACCESS_TOKEN, (err) => {
		if (err) return res.json(response(true, msg.unauthorized, {}))
		db.query(
			`DELETE FROM token WHERE user_id = ?`,
			[user_id],
			(err, results) => {
				if (err || results.affectedRows == 0) {
					return res.json(
						response(true, 'Terjadi kesalahan saat proses logout.', {}),
					)
				} else {
					return res.json(response(false, 'Berhasil logout', {}))
				}
			},
		)
	})
}
const info = async (req, res) => {
	try {
		req.info.token = await getTokenList(req.info.user_id)
		req.info.name = await getName(req.info.user_id)
		req.info.status = await checkStatus(req.info.user_id)
		return res.json(response(false, '', req.info))
	} catch (e) {
		return res.json(e)
	}
}
const uploadAvatar = (req, res) => {
	db.query(
		'UPDATE user SET photo = ? WHERE user_id = ?',
		[req.files.filename, req.info.user_id],
		(err) => {
			if (err) return res.json(response(true, msg.failed, ''))
			return res.json(response(false, 'Avatar berhasil diganti', ''))
		},
	)
}
module.exports = {
	checkNIM,
	checkStatus,
	checkUsername,
	checkEmail,
	getTokenList,
	register,
	login,
	logout,
	logoutAll,
	editProfile,
	info,
	uploadAvatar,
}
