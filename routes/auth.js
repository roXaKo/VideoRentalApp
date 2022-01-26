const express = require('express')
const router = express.Router()
const { User } = require('../models/userModel')
const bcrypt= require('bcrypt')

router.post('/', async (req, res) => {
    if (!await User.findOne({email: req.body.email})) return res.status(400).send('Email or Password wrong')

    let comp = await User.findOne({email: req.body.email}).select({name:1, email:1, password:1})
    let login = await bcrypt.compare(req.body.password, comp.password)
    
    if (login!==true) return res.status(400).send('Email or Password wrong')

    const token = comp.generateAuthToken()
    let back = {name: comp.name}
    
    res.header('x-auth-token',token).send(back)
})

module.exports = router