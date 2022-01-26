const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { User } = require('../models/userModel')
const bcrypt = require('bcrypt')
const auth = require('../middleware/auth')
const Joi = require('joi')

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password')

    if (!user) return res.status(500).send('something went wrong')

    res.send(user)
})

router.post('/', async (req, res) => {
    const mailPattern = /.*@.*..*/
    const userSchema = Joi.object({
        name: Joi.string().min(5).max(255).required(),
        email: Joi.string().pattern(mailPattern).min(5).max(255).required(),
        password: Joi.string().min(8).max(128)
    }).unknown()

    const valid = userSchema.validate(req.body)
    if (valid.error) return res.status(400).send(valid.error.message)

    if (await User.findOne({ email: req.body.email })) res.status(400).send('This User already exists')
    const salt = await bcrypt.genSalt(14)
    const password = await bcrypt.hash(req.body.password, salt)
    let user = new User({
        name: req.body.name,
        email: req.body.email,
        password: password
    })

    await user.save()
    
    let back = { name: user.name, email: user.email }
    const token = user.generateAuthToken()

    res.header('x-auth-token', token).send(back)
})

module.exports = router