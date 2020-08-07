const express = require('express')
const multer = require('multer')
const {msg, response} = require('../helper/helper')
const path = require('path')
require('dotenv').config()

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		if (file.fieldname == 'avatar') {
			cb(null, 'public/avatar/')
		} else if (file.fieldname == 'media' || file.fieldname == 'thumbnail') {
			cb(null, 'public/media/')
		} else if (file.fieldname == 'productData') {
			cb(null, 'public/product/')
		} else {
			cb(null, 'public/other/')
		}
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(
			null,
			file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
		)
	},
})
const checkFileType = (file, cb) => {
	if (file.fieldname === 'avatar' || file.fieldname === 'thumbnail') {
		if (
			file.mimetype === 'image/png' ||
			file.mimetype === 'image/jpg' ||
			file.mimetype === 'image/jpeg' ||
			file.mimetype === 'image/gif'
		) {
			cb(null, true)
		} else {
			cb(msg.extNotAllow, false)
		}
	} else if (file.fieldname === 'media') {
		if (
			file.mimetype === 'image/png' ||
			file.mimetype === 'image/jpg' ||
			file.mimetype === 'image/jpeg' ||
			file.mimetype === 'image/gif' ||
			file.mimetype === 'video/x-flv' ||
			file.mimetype === 'video/mp4' ||
			file.mimetype === 'video/3gpp' ||
			file.mimetype === 'video/quicktime' ||
			file.mimetype === 'video/x-msvideo' ||
			file.mimetype === 'video/x-ms-wmv'
		) {
			cb(null, true)
		} else {
			cb(msg.extNotAllow, false)
		}
	} else if (file.fieldname === 'productData') {
		cb(null, true)
	} else {
		cb(msg.unkownForm, false)
	}
}

const upload = (req, res, next) => {
	multer({
		storage: storage,
		fileFilter: (req, file, cb) => {
			checkFileType(file, cb)
		},
	}).fields([
		{
			name: 'avatar',
			maxCount: 1,
		},
		{
			name: 'media',
			maxCount: 15,
		},
		{
			name: 'thumbnail',
			maxCount: 1,
		},
		{
			name: 'productData',
			maxCount: 1,
		},
	])(req, res, (err) => {
		if (err) {
			if (err.code) {
				if (err.code == 'LIMIT_UNEXPECTED_FILE') {
					return res.json(response(true, msg.fileLimit, {}))
				} else {
					return res.json(response(true, err.code, {}))
				}
			}
			return res.json(response(true, err, {}))
		} else {
			next()
		}
	})
}

module.exports = {
	upload,
}
