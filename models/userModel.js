const mongoose = require('mongoose')
const joi = require('joi')
const { valid } = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 5,
        maxlength: 255,
        required: true
    },
    email: {
        type: String,
        unique: true,
        minlength: 5,
        maxlength: 255,
        validate: /.*@.*..*/,
        required: true
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 128,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({name: this.name, _id: this._id, isAdmin: this.isAdmin }, config.get('jwtPrivateKey'))
    return token
}

const User = mongoose.model('user', userSchema)

exports.User = User