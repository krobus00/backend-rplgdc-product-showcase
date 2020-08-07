const db = require('../config/database')
const jwt = require('jsonwebtoken')
const {msg, response} = require('../helper/helper')
const {checkStatus} = require('../controller/user.controllers')
require('dotenv').config()

/**
 *
 * @param  {string[]} allow array user yang diizinkan
 */
const permit = (...allow) => {
	const isAllowed = (status) => allow.indexOf(status) > -1
	return async (req, res, next) => {
		try {
			if (isAllowed(await checkStatus(req.info.user_id))) {
				next()
			} else {
				return res.json(response(true, msg.unauthorized, {}))
			}
		} catch (e) {
			return res.json(response(true, msg.unauthorized, {error: e}))
		}
	}
}

const authToken = async (req, res, next) => {
	const authHeader = req.headers['authorization'] || ''
	const token = authHeader.split(' ')[1]
	if (token == null) return res.json(response(true, msg.unauthorized, {}))
	jwt.verify(token, process.env.ACCESS_TOKEN, (err, info) => {
		if (err) return res.json(response(true, msg.unauthorized, {}))
		db.query('SELECT * FROM token WHERE token = ?', [token], (err, results) => {
			if (results.length >= 1) {
				if (Date.parse(results[0].create_at) >= info.iat * 1000) {
					req.info = info
					next()
				} else {
					return res.json(response(true, msg.unauthorized, {}))
				}
			} else {
				return res.json(response(true, msg.unauthorized, {}))
			}
		})
	})
}
module.exports = {
	authToken,
	permit,
}
