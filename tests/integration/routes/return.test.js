const { Rents } = require('../../../models/rentsModel')
const mongoose = require('mongoose')
const { User } = require('../../../models/userModel')
const { Movie } = require('../../../models/movieModel')
const request = require('supertest')
const moment = require('moment')
const { Customers } = require('../../../models/customerModel')
const { Genre } = require('../../../models/genresModel')


describe('/api/returns', () => {
    let server
    let customerId
    let movieId
    let rental
    let token

    beforeEach(async () => {
        server = require('../../../index')

        movieId = mongoose.Types.ObjectId()
        customerId = mongoose.Types.ObjectId()
        token = new User().generateAuthToken()
        customer = new Customers({
            _id: customerId,
            name: "Abc Def",
            phone: "012345678"
        })
        await customer.save()
        genre = new Genre({ name: "testgenre1" })
        // movie = new Movie({
        //     titel: testmovie1,
        //     genre: {name: "testgenre1"},
        //     dailyRentalRate: 2,
        //     numberInStock: 2
        // })

        let movie = new Movie({
            _id: movieId,
            title: "movie1",
            genre: { name: "testgenre1" },
            numberInStock: 2,
            dailyRentalRate: 2
        })
        await movie.save()
        rental = new Rents({
            customer: {
                _id: customerId, 
                name: "Abc Def",
                phone: "012345678"
            },
            title: {
                _id: movieId,
                numberInStock: 2,
                dailyRentalRate: 2
            },
            dateOut: new Date

        })
        await rental.save()
    })

    function exec() {
        return request(server).post('/api/returns').set('x-auth-token', token).send({ customerId, title: movieId })
    }

    afterEach(async () => {
        await server.close()
        await Rents.deleteMany({})
        await Movie.deleteMany({})
        await Customers.deleteMany({})
    })

    it('should populate the test env', async () => {
        const rent = await Rents.findOne({}).populate()

        expect(rent).toBeDefined()
    })
    it('should return 401 if client is not logged in', async () => {
        token = ''
        const res = await exec()
        expect(res.status).toBe(401)
    })
    it('should return 400 if customerId is not provided', async () => {
        customerId = ''
        const res = await exec()

        expect(res.status).toBe(400)
    })
    it('should return 400 if movieId is not provided', async () => {
        movieId = ''
        const res = await exec()

        expect(res.status).toBe(400)
    })
    it('should return 404 if no rent is found', async () => {
        movieId = mongoose.Types.ObjectId()
        const res = await exec()

        expect(res.status).toBe(404)
    })
    it('should return 404 if rent is already processed', async () => {
        let mod = await Rents.findOne({ "customer._id": customerId })
        mod.dateReturned = new Date
        await mod.save()
        
        const res = await exec()

        expect(res.status).toBe(400)
    })
    it('should return 200 if request is valid', async () => {
        const res = await exec()

        expect(res.status).toBe(200)
    })
    it('should have set a dateReturnde', async () => {
        const res = await exec()
        let mod = await Rents.findOne({ "customer._id": customerId })
        diff = mod.dateReturned - new Date
        expect(diff).toBeLessThan(10 * 1000)
    })
    it('should have set a rental Fee', async () => {
        rental.dateOut = moment().add(-7, 'days').toDate()
        await rental.save()
        const res = await exec()
        let mod = await Rents.findOne({ "customer._id": customerId })
        expect(mod.rentalFee).toBe(14)
    })
    it('should have incresed the number in stock', async () => {

        const res = await exec()
        let mod = await Movie.findOne({ _id: movieId })
        expect(mod.numberInStock).toBe(3)
    })
})

