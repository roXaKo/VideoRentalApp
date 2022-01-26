const { User } = require('../../models/userModel')
const jwt = require('jsonwebtoken')


describe('name', () =>
    it('it should have a valid jwtToken', () => {
        let userId = new User ({ _id: "61c2de489f540eba818afe14" })
        result = userId.generateAuthToken()
        expect(result).toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/)
    }))