const request = require('supertest')
const { Genre } = require('../../../models/genresModel')
const { User } = require('../../../models/userModel')

describe('auth middleware', () => {
    let server
    let token
    beforeEach(async () => {
        token = new User().generateAuthToken()
        server = require('../../../index')
    })
    afterEach(async () => {
        await server.close()
        await User.deleteMany({})
        await Genre.deleteMany({})
    })

    

    const execValid = () => {
        return request(server).post("/api/genres/new").set({ "x-auth-token": token }).send({ name: "genre1" })
    }
    beforeEach(() => { })
    describe('token validation', () => {
        it('schould return 401 if there is no token', async () => {
            token = ""

            const res = await execValid()

            expect(res.status).toBe(401)
        })
        it('schould return 400 if token is invalid', async () => {
            token = "a"

            const res = await execValid()
            expect(res.status).toBe(400)
        })

        it('schould return 200', async () => {
            const res = await execValid()

            expect(res.status).toBe(200)
        })
    })
})

