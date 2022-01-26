const Mongoose = require('mongoose')
const request = require('supertest')
const { Customers } = require('../../../models/customerModel')
const { Movie, movieSchema } = require('../../../models/movieModel')
const { Rents } = require('../../../models/rentsModel')
const { User } = require('../../../models/userModel')


describe('api/rents', () => {
    let server
    let cus1
    let cus2
    let _idCus1
    let _idCus2
    let movie1
    let movie2
    let _idMovie1
    let _idMovie2
    let _idMovie3
    let rent1
    let rent2
    let _idRent1
    let _idRent2
    let token


    beforeEach(async () => {
        server = require('../../../index')

        token = new User().generateAuthToken()

        _idCus1 = Mongoose.Types.ObjectId()
        _idCus2 = Mongoose.Types.ObjectId()
        _idMovie1 = Mongoose.Types.ObjectId()
        _idMovie2 = Mongoose.Types.ObjectId()
        _idMovie3 = Mongoose.Types.ObjectId()
        _idRent1 = Mongoose.Types.ObjectId()
        _idRent2 = Mongoose.Types.ObjectId()


        cus1 = { _id: _idCus1, name: "Customer One", phone: "123123123" }
        cus2 = { _id: _idCus2, name: "Customer Two", phone: "123123124", isGold: true }
        await Customers.insertMany([cus1, cus2])

        movie1 = { _id: _idMovie1, title: "title1", genre: { name: "genre" }, numberInStock: 1, dailyRentalRate: 1 }
        movie2 = { _id: _idMovie2, title: "title2", genre: { name: "genre" }, numberInStock: 2, dailyRentalRate: 2 }
        movie3 = { _id: _idMovie3, title: "title3", genre: { name: "genre" }, numberInStock: 0, dailyRentalRate: 2 }
        await Movie.insertMany([movie1, movie2, movie3])

        rent1 = { _id: _idRent1, customer: cus1, title: movie1, dateOut: new Date }
        rent2 = { _id: _idRent2, customer: cus2, title: movie2, dateOut: new Date }
        await Rents.insertMany([rent1, rent2])
    })

    afterEach(async () => {
        await server.close()
        await Customers.deleteMany({})
        await Movie.deleteMany({})
        await Rents.deleteMany({})


    })

    const execPost = () => {
        return request(server)
            .post('/api/rents/new')
            .set('x-auth-token', token)
            .send({ customer: _idCus1, movie: _idMovie2 })
    }
    const execDel = () => {
        return request(server)
            .delete(`/api/rents/${_idCus1}/${_idMovie1}`)
            .set('x-auth-token', token)
    }
    const execPut = () => {
        return request(server)
            .put(`/api/rents/${_idCus1}/${_idMovie1}`)
            .set('x-auth-token', token)
            .send({ customer: _idCus2, title: _idMovie2 })
    }
    describe('GET', () => {
        it('should return all rents', async () => {
            res = await request(server).get("/api/rents")

            expect(res.body.length).toBe(2)
        })
        it('should return one rents of one customer /:name', async () => {
            res = await request(server).get(`/api/rents/${_idRent1}`)

            expect(res.body._id.toString()).toMatch(_idRent1.toString())
            expect(res.body).toHaveProperty("customer")
            expect(res.body).toHaveProperty("title")
        })
    })
    describe('POST /new', () => {
        it('should return 401 if not logged in', async () => {
            token = ""
            res = await execPost()

            expect(res.status).toBe(401)
        })
        it('should return 400 customer is not valid objId', async () => {
            _idCus1 = "asd"
            res = await execPost()

            expect(res.status).toBe(400)
        })
        it('should return 400 movie is not valid objId', async () => {
            _idMovie2 = "asd"
            res = await execPost()

            expect(res.status).toBe(400)
        })
        it('should return 404 customer is not found in db', async () => {
            _idCus1 = Mongoose.Types.ObjectId()
            res = await execPost()

            expect(res.status).toBe(404)
        })
        it('should return 404 movie is not found in db', async () => {
            _idMovie2 = Mongoose.Types.ObjectId()
            res = await execPost()

            expect(res.status).toBe(404)
        })
        it('should return 400 if no movie left in stock', async () => {
            _idMovie2 = _idMovie3
            res = await execPost()

            expect(res.status).toBe(400)
        })
        it('should return 200 if rent is saved; return customer and movie id', async () => {
            res = await execPost()

            expect(res.status).toBe(200)
            expect(res.body).toMatchObject(_idCus1)
            expect(res.body).toMatchObject(_idMovie2)
        })
        it('should decrease the movie in stock', async () => {
            await execPost()
            db = await Movie.findById(_idMovie2).select({ numberInStock: 1 })

            expect(movie2.numberInStock - 1).toBe(db.numberInStock)
        })
        it('should save the rent in db', async () => {
            await execPost()

            db = await Rents.lookup(_idCus1, _idMovie2)

            expect(db.customer).toMatchObject(cus1)
            expect(movie2).toMatchObject(db.title)
        })
    })
    describe('DELETE /:name/:title', () => {
        it('should return 401 if not logged in', async () => {
            token = ""
            res = await execDel()

            expect(res.status).toBe(401)
        })
        it('should return 400 if provided params are no valid ObjId', async () => {
            _idCus1 = "dasf"
            res = await execDel()

            expect(res.status).toBe(400)
        })

        it('should return 404 if no rent found', async () => {
            _idCus1 = Mongoose.Types.ObjectId()
            res = await execDel()

            expect(res.status).toBe(404)
        })
        it('should return 200 rent is deleted; should return deletet rent', async () => {
            res = await execDel()

            expect(res.status).toBe(200)
            expect(res.text).toMatch(_idRent1.toString())
        })
        it('should increase the number in stock', async () => {
            await execDel()

            db = await Movie.findById(_idMovie1).select({ numberInStock: 1 })

            expect(db.numberInStock).toBe(movie1.numberInStock + 1)
        })
        it('should delete the rent from db', async () => {
            await execDel()

            db = await Rents.findById(_idRent1)
            expect(db).toBe(null)
        })
    })
    describe('PUT /:name/:title', () => {
        it('should return 401 if not logged in', async () => {
            token = ""
            res = await execPut()

            expect(res.status).toBe(401)
        })
        it('should return 400 if provided params are no valid ObjId', async () => {
            _idCus1 = "dasf"
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 404 if rent is not found', async () => {
            _idCus1 = Mongoose.Types.ObjectId()
            res = await execPut()

            expect(res.status).toBe(404)
        })
        it('should return 400 if new customer is no valid objId', async () => {
            _idCus2 = "asd"
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 400 if new movie is no valid objId', async () => {
            _idMovie2 = "asd"
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 400 if new rent is not in stock', async () => {
            _idMovie2 = _idMovie3
            res = await execPut()

            expect(res.status).toBe(400)
        })
        it('should return 200 if rent is updated; return new rent', async () => {
            res = await execPut()

            expect(res.status).toBe(200)
            expect(cus2.toString()).toMatch(res.body.customer.toString())
            expect(movie2.toString()).toMatch(res.body.title.toString())

        })
        it('should increase old movie in stock', async () => {
            res = await execPut()

            db = await Movie.findById(_idMovie1).select('+numberInStock')
            expect(db.numberInStock).toBe(movie1.numberInStock + 1)
        })
        it('should decrease new movie in stock', async () => {
            res = await execPut()

            db = await Movie.findById(_idMovie2).select('+numberInStock')
            expect(db.numberInStock).toBe(movie2.numberInStock - 1)
        })
        it('should update rent in db', async () => {
            res = await execPut()

            db = await Rents.find({ "customer._id": _idCus2, "title._id": _idMovie2 })
            expect(db.length).toBe(2)
        })
    })
})