const request = require('supertest')
const { Movie } = require('../../../models/movieModel')
const { Genre } = require('../../../models/genresModel')
const { User } = require('../../../models/userModel')


describe('/api/movies', () => {
    let server
    let testgenre1
    let testgenre2
    let testmovie1
    let token
    let newtitle
    let newstock
    let newrent

    beforeEach(async () => {
        server = require('../../../index')

        token = new User().generateAuthToken()
        testgenre1 = "testgenre1"
        testgenre2 = "testgenre2"
        testmovie1 = "testmovie1"
        newtitle = "testmovie3"
        newstock = 3
        newrent = 3
        await Genre.insertMany([
            { name: testgenre1 },
            { name: testgenre2 }
        ])
        await Movie.insertMany([
            { title: testmovie1, genre: { name: testgenre1 }, numberInStock: 1, dailyRentalRate: 1 },
            { title: 'testmovie2', genre: { name: testgenre2 }, numberInStock: 2, dailyRentalRate: 2 }
        ])
    })

    afterEach(async () => {
        await server.close()
        await Genre.deleteMany({})
        await Movie.deleteMany({})
    })
    execPost = () => {
        return request(server).post('/api/movies/new')
            .set('x-auth-token', token)
            .send({
                title: newtitle,
                genre: testgenre1,
                numberInStock: newstock,
                dailyRentalRate: newrent
            })
    }
    execDel = () => {
        return request(server)
            .delete(`/api/movies/${testmovie1}`)
            .set('x-auth-token', token)
    }
    execPut = () => {
        return request(server).put(`/api/movies/${testmovie1}`)
            .set('x-auth-token', token)
            .send({
                title: newtitle,
                genre: testgenre1,
                numberInStock: newstock,
                dailyRentalRate: newrent
            })
    }
    describe('GET', () => {
        it('/ should return all movies', async () => {
            res = await request(server).get('/api/movies')

            expect(res.status).toBe(200)
            expect(res.body.length).toBe(2)
        })
        it('/:name should return one movie', async () => {
            res = await request(server).get(`/api/movies/${testmovie1}`)

            expect(res.status).toBe(200)
            expect(res.body.title).toMatch(testmovie1)
        })
    })
    describe('POST /new', () => {
        it('schould return return 401 if user is not logged in', async () => {
            token = ""
            res = await execPost()

            expect(res.status).toBe(401)
        })
        it('schould return return 400 if movie already exists', async () => {
            newtitle = testmovie1
            res = await execPost()

            expect(res.status).toBe(400)
        })

        it('schould return return 400 if title doesnt fit schema', async () => {
            newtitle = ""
            res = await execPost()
            expect(res.status).toBe(400)
        })
        it('schould return return 400 if genre doesnt fit schema', async () => {
            testgenre1 = ""
            res = await execPost()
            expect(res.status).toBe(400)
        })
        it('schould return return 400 if stocknumber doesnt fit schema', async () => {
            newstock = ""
            res = await execPost()
            expect(res.status).toBe(400)
        })
        it('schould return return 400 if rentalrate doesnt fit schema', async () => {
            newrent = ""
            res = await execPost()
            expect(res.status).toBe(400)
        })
        it('schould return return 400 if genre doesnt exist', async () => {
            testgenre1 = "notExisting"
            res = await execPost()

            expect(res.status).toBe(400)
        })
        it('schould return return 200 if is saved; movie object should be in res', async () => {
            res = await execPost()

            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("title")
            expect(res.body).toHaveProperty("genre")
            expect(res.body).toHaveProperty("numberInStock")
            expect(res.body).toHaveProperty("dailyRentalRate")
        })
        it('schould save data in db', async () => {
            res = await execPost()
            let db = await Movie.findOne({ title: newtitle })

            expect(db).toHaveProperty("title")
            expect(db).toHaveProperty("genre")
            expect(db).toHaveProperty("numberInStock")
            expect(db).toHaveProperty("dailyRentalRate")
        })
    })
    describe('DELETE /:title', () => {
        it('schould return return 401 if user is not logged in', async () => {
            token = ""
            res = await execDel()

            expect(res.status).toBe(401)
        })
        it('should return 404 if no movie found', async () => {
            testmovie1 = "notExisting"
            res = await execDel()

            expect(res.status).toBe(404)
        })
        it('should return 200 if movie was deleted; title and id should be in res', async () => {
            res = await execDel()

            expect(res.status).toBe(200)
            expect(res.text).toMatch("_id")
        })
        it('should delete movie from db', async () => {
            res = await execDel()
            let db = await Movie.findOne({ title: testmovie1 })

            expect(db === null).toBeTruthy()
        })
    })
    describe('PUT /:title', () => {
        it('schould return return 401 if user is not logged in', async () => {
            token = ""
            res = await execPut()

            expect(res.status).toBe(401)
        })
        it('should return 400 if new values dont fit schema', async () => {
            newstock = "a"
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 404 if movie is not in db', async () => {
            testmovie1 = "notExisting"
            res = await execPut()

            expect(res.status).toBe(404)
        })
        it('should return 404 if genre does not exist', async () => {
            testgenre1 = "notExisting"
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 400 if new title is already in db', async () => {
            newtitle = testmovie1
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 200 if movie is updated; movie obj should be in res', async () => {
            res = await execPut()

            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty("title")
            expect(res.body).toHaveProperty("genre")
            expect(res.body).toHaveProperty("numberInStock")
            expect(res.body).toHaveProperty("dailyRentalRate")
        })
        it('should update movie in db', async () => {
            res = await execPut()
            let db = await Movie.findOne({ title: newtitle }).select({ title: 1, genre: 1, numberInStock: 1, dailyRentalRate: 1 }).populate('genre')

            expect(db.toString()).toMatch(res.body.title.toString())
            expect(db.toString()).toMatch(res.body.numberInStock.toString())
            expect(db.toString()).toMatch(res.body.dailyRentalRate.toString())
        })
    })
})