const request = require('supertest')
const { Genre } = require('../../../models/genresModel')
const { User } = require('../../../models/userModel')

describe('/api/genres', () => {
    let server
    let token
    let newName
    let putGenreName
    let genre1 = 'genre1'
    beforeEach(async () => {
        server = require('../../../index')
        await Genre.collection.insertMany([
            { name: genre1 },
            { name: 'genre2' }
        ])
        token = new User().generateAuthToken()
        newName = "genre3"
        putGenreName = genre1
    })

    afterEach(async () => {
        await Genre.deleteMany({})
        await User.deleteMany({})
        await server.close()
    })

    execNew = () => {
        return request(server).post('/api/genres/new').set('x-auth-token', token).send({ name: newName })
    }
    execPut = () => {
        return request(server).put(`/api/genres/${putGenreName}`).set('x-auth-token', token).send({ name: newName })
    }
    describe('GET /', () => {
        it('should return all genres', async () => {
            const res = await request(server).get('/api/genres')
            expect(res.status).toBe(200)
            expect(res.body.length).toBe(2)
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy()
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy()

        })
    })

    describe('GET /:name', () => {
        it('should return a single genre', async () => {
            const res = await request(server).get('/api/genres/genre1')
            expect(res.status).toBe(200)
            expect(res.body.name === 'genre1').toBeTruthy()
            expect(res.body).toHaveProperty("_id")

        })

        it('should return 404', async () => {
            const res = await request(server).get('/api/genres/genre3')

            expect(res.status).toBe(404)
        })
    })
    describe('POST /new', () => {
        it('should return 401 if client is not logged in', async () => {
            token = ""
            const res = await execNew()

            expect(res.status).toBe(401)
        })
        it('should return 400 if genre less is than 5 char', async () => {
            newName = new Array(3).join('a')
            const res = await execNew()

            expect(res.status).toBe(400)
        })
        it('should return 400 if genre is more than 5 char', async () => {

            newName = new Array(52).join('a')
            res = await execNew()

            expect(res.status).toBe(400)
        })
        it('should return 400 if genre is already existing', async () => {
            newName = genre1
            res = await execNew()

            expect(res.status).toBe(400)
        })
        it('should save a genre', async () => {
            res = await execNew()

            const genre = await Genre.findOne({ name: newName })

            expect(genre).toHaveProperty('name')
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("name")
            expect(res.body).toHaveProperty("_id")
        })
    })
    describe('DELETE /:name', () => {
        it('should delete a genre', async () => {
            const res = await request(server).delete('/api/genres/genre1').set('x-auth-token', token)
            const db = await Genre.findOne({ name: 'genre1' })

            expect(res.status).toBe(200)
            expect(db).toBe(null)
        })
    })
    describe('PUT /:name', () => {
        it('should return 404 if no genre is found', async () => {
            putGenreName = "somethingNotExisting"
            res = await execPut()

            expect(res.status).toBe(404)
        })
        it('should return 200 genre if was changed', async () => {
            res = await execPut()


        })
        it('should return the new name have it saved in db', async () => {
            res = await execPut()
            const db = await Genre.findOne({name: newName})

            expect(res.body.name).toMatch(newName)
            expect(db.name).toMatch(newName)
        })
    })
})
