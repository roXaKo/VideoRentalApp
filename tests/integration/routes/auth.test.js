const request = require('supertest')
const { User } = require('../../../models/userModel')
const bcrypt = require('bcrypt')

describe('auth middleware', () => {
    let server
    let email
    let password
    let user
    beforeEach(async () => {
        server = require('../../../index')
        email = "abc@def.de"
        password = "12345678"

        let hashpass = await bcrypt.hash(password, await bcrypt.genSalt(14))
        
        user = new User({ name: "someName", email: email, password: hashpass })
        await user.save()
    })
    afterEach(async () => {
        await server.close()
        await User.deleteMany({})
    })

    const execLogin = () => {
        return request(server).post("/api/auth").send({ email: email, password: password })
    }
    it('should make this suit pass if all other tests of this suit are commented out',()=>{})

    describe('login validation', () => {
        it('should return 400 if user not found', async () => {
            email = "abb@def.de"
            res = await execLogin()

            expect(res.status).toBe(400)
        })
        it('should return 400 if email and apssword dont match', async () => {
            password = "12345677"
            res = await execLogin()

            expect(res.status).toBe(400)
        })
        it('should return 200 if login successfull', async () => {
            res = await execLogin()

            expect(res.status).toBe(200)
        })
        it('should return username if login successfull', async () => {
            res = await execLogin()

            expect(res.body).toHaveProperty("name")
        })
        it('should return a header wit token if login successfull', async () => {
            res = await execLogin()

            expect(res.header).toHaveProperty('x-auth-token')
        })
    })
})
