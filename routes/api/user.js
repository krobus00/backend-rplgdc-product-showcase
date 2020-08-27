const desc = 'Routing user'
const path = '/user'
const express = require('express')
const router = express.Router()

const validate = require('../../helper/validator')
const {upload} = require('../../middleware/upload')
const {authToken} = require('../../middleware/auth')
const user = require('../../controller/user.controllers')

router.post('/register', validate.register, user.register)
router.get('/logout', authToken, user.logout)
router.get('/logoutAll', authToken, user.logoutAll)
router.post('/login', validate.login, user.login)
router.put('/editprofile', authToken, upload, validate.editProfile, user.editProfile)
router.get('/info', authToken, user.info)
router.get('/userinfo', authToken,user.getUserInfo)
router.post('/upload_avatar', authToken, upload, user.uploadAvatar)

module.exports = {
	router,
	desc,
	path,
}
