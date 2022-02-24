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
        name: Joi.string().min(5).max(255).required().label("Name"),
        email: Joi.string().pattern(mailPattern).min(5).max(255).required().label("Email"),
        password: Joi.string().min(8).max(128).label("Password")
    })

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

    res.header('x-auth-token', token).header("access-control-expose-headers", "x-auth-token").send(back)
})

router.put("/me", async(req,res)=>{
    const mailPattern = /.*@.*..*/
    const userSchema = Joi.object({
        name: Joi.string().min(5).max(255).required().label("Name"),
        email: Joi.string().pattern(mailPattern).min(5).max(255).required().label("Email"),
        password: Joi.string().min(8).max(128).label("Password"),
        _id: Joi.string()
    })

    const valid = userSchema.validate(req.body)
    if (valid.error) return res.status(400).send(valid.error.message)
    
    const userOld = await User.findById(req.body._id).select('-password')
    const checkUser = await User.findOne({ email: req.body.email })
    if (checkUser && (checkUser.email !==userOld.email)) return res.status(400).send('This User already exists')

    const salt = await bcrypt.genSalt(14)
    const password = await bcrypt.hash(req.body.password, salt)
    let user = {
        name: req.body.name,
        email: req.body.email,
        password: password
    }
    await User.findByIdAndUpdate(req.body._id, user)
    user = await User.findById(req.body._id)

    let back = { name: user.name, email: user.email }
    const token = user.generateAuthToken()

    res.header('x-auth-token', token).header( "x-auth-token").send(back)
})

module.exports = router