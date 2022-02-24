const request = require('supertest')
const { Movie } = require('../../../models/movieModel')
const { Genre } = require('../../../models/genresModel')
const { User } = require('../../../models/userModel')
const  Mongoose  = require('mongoose')


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
        testgenre1id = Mongoose.Types.ObjectId()
        testgenre2id = Mongoose.Types.ObjectId()
        testmovie1 = "testmovie1"
        testmovie1id = Mongoose.Types.ObjectId()
        newtitle = "testmovie3"
        newstock = 3
        newrent = 3
        await Genre.insertMany([
            { _id: testgenre1id, name: "testgenre1" },
            { _id: testgenre2id, name: "testgenre2" }
        ])
        await Movie.insertMany([
            { _id: testmovie1id, title: testmovie1, genre: { _id:  testgenre1id,name: "testgenre1" }, numberInStock: 1, dailyRentalRate: 1 },
            { title: 'testmovie2', genre: {_id: testgenre2id, name: "testgenre2" }, numberInStock: 2, dailyRentalRate: 2 }
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
                genre: testgenre1id,
                numberInStock: newstock,
                dailyRentalRate: newrent
            })
    }
    execDel = () => {
        return request(server)
            .delete(`/api/movies/${testmovie1id}`)
            .set('x-auth-token', token)
    }
    execPut = () => {
        return request(server).put(`/api/movies/${testmovie1id}`)
            .set('x-auth-token', token)
            .send({
                title: newtitle,
                genre: testgenre2id,
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
        it('it should return 404 if user not found', async () => {
            _id1 = Mongoose.Types.ObjectId
            res = await request(server).get(`/api/movies/${Mongoose.Types.ObjectId()}`)

            expect(res.status).toBe(404)
        })
        it('/:name should return one movie', async () => {
            res = await request(server).get(`/api/movies/${testmovie1id}`)

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
            testgenre1id = ""
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
            testgenre1id = Mongoose.Types.ObjectId()
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
    describe('DELETE /:_id', () => {
        it('schould return return 401 if user is not logged in', async () => {
            token = ""
            res = await execDel()

            expect(res.status).toBe(401)
        })
        it('should return 404 if no movie found', async () => {
            testmovie1id = Mongoose.Types.ObjectId()
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
            let db = await Movie.findById(testmovie1id)

            expect(db === null).toBeTruthy()
        })
    })
    describe('PUT /:_id', () => {
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
            testmovie1id = Mongoose.Types.ObjectId()
            res = await execPut()

            expect(res.status).toBe(404)
        })
        it('should return 404 if genre does not exist', async () => {
            testgenre2id = Mongoose.Types.ObjectId()
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