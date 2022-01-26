const config = require('config')
// const { request } = require('express')
const { Genre } = require('../../models/genresModel')
const { User } = require('../../models/userModel')
const auth = require('../../middleware/auth')
const Mongoose = require('mongoose')

describe('auth middleware', () => {

    it('should return the decoded value true', () => {
        let user = { _id: Mongoose.Types.ObjectId().toHexString() }
        let token = new User(user).generateAuthToken()
        let req = { header: jest.fn().mockReturnValue(token) }
        const next = jest.fn()
        const res = {}

        auth(req, res, next)
        expect(req.user).toMatchObject(user)
    })
})