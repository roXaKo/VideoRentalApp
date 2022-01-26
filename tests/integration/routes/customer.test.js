const request = require('supertest')
const { Customers } = require('../../../models/customerModel')
const Mongoose = require('mongoose')
const { User } = require('../../../models/userModel')


describe('/api/user', () => {
    let server
    let cus1
    let cus2
    let token
    let _id1
    let _id2
    let cus3
    beforeEach(async () => {
        server = require('../../../index')

        token = new User().generateAuthToken()

        _id1 = Mongoose.Types.ObjectId()
        _id2 = Mongoose.Types.ObjectId()

        cus1 = { _id: _id1, name: "Customer Cus", phone: "123123123" }
        cus2 = { _id: _id2, name: "Customer Cust", phone: "123123124", isGold: true }
        cus3 = { name: "Customer Custer", phone: "0123123122", isGold: true }
        await Customers.insertMany([cus1, cus2])
    })
    afterEach(async () => {
        await server.close()
        await User.deleteMany({})
        await Customers.deleteMany({})
    })

    const senderNew = () => {
        return request(server)
            .post('/api/customer/new')
            .set('x-auth-token', token)
            .send(cus3)
    }
    const senderDelete = () => {
        return request(server)
            .delete(`/api/customer/${_id1}`)
            .set('x-auth-token', token)
    }
    const senderPut = () => {
        return request(server)
            .put(`/api/customer/${_id1}`)
            .set('x-auth-token', token)
            .send(cus3)
    }
    
    it('should return all users', async () => {
        res = await request(server).get('/api/customer')
        expect(res.body.length).toBe(2)
        expect(res.status).toBe(200)
    })
    describe('GET /:id', () => {
        it('it should return 404 if user not found', async () => {
            _id1 = Mongoose.Types.ObjectId
            res = await request(server).get(`/api/customer/${_id1}`)

            expect(res.status).toBe(404)
        })
        it('should return a single user', async () => {
            res = await request(server).get(`/api/customer/${_id1}`)

            expect(res.body.name == 'Customer Cus').toBeTruthy()
            expect(res.status).toBe(200)
        })
    })
    describe('POST /:new', () => {
        it('should return 401 if not logged in', async () => {
            const res = await request(server).post('/api/customer/new').send({ _id: _id1, name: "Customer Custer", phone: "0123123122", isGold: false })
            expect(res.status).toBe(401)
        })
        it('should return 400 if phone is not set', async () => {
            cus3.phone = ""
            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should return 400 if name is not set', async () => {
            cus3.name = ""
            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should return 400 if phone doesnt fit ', async () => {
            cus3.phone = "1111111"
            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should return 400 if name doesnt fit', async () => {
            cus3.name = "DecoyName1"
            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should return 400 if name is already in db', async () => {
            cus3.name = cus1.name
            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should return 400 if phone is already in db', async () => {
            cus3.phone = "0" + cus1.phone

            const res = await senderNew()

            expect(res.status).toBe(400)

        })
        it('should save in db', async () => {
            const res = await senderNew()
            let db = await Customers.findOne({ name: "Customer Custer" }).select({ __v: 1, isGold: 1, name: 1, phone: 1 })
            expect(res.status).toBe(200)
            expect(db).toBeDefined()


        })
        it('should return the constomers name', async () => {
            const res = await senderNew()

            expect(res.body).toHaveProperty("name")
        })
        it('should return the constomers phonenr', async () => {
            const res = await senderNew()

            expect(res.body).toHaveProperty("phone")
        })
    })
    describe('DELETE /:_id', () => {
        it('should return 401 if not logged in', async () => {
            const res = await request(server).delete(`/api/customer/${_id1}`)

            expect(res.status).toBe(401)
        })
        it('should return 404 if no customer found', async () => {
            _id1 = Mongoose.Types.ObjectId()
            const res = await senderDelete()

            expect(res.status).toBe(404)
        })
        it('should delete a constomer', async () => {
            const res = await senderDelete()

            db = await Customers.findById(_id1)

            expect(db).toBe(null)
            expect(res.status).toBe(200)
        })
        it('should return the deleted constomers id', async () => {
            const res = await senderDelete()
            expect(res.text).toMatch(_id1.toString())
        })
    })
    describe('PUT /:_id', () => {
        it('should return 401 if not logged in', async () => {
            const res = await request(server).put(`/api/customer/${_id1}`)

            expect(res.status).toBe(401)
        })
        it('should throw if phone doesnt fit ', async () => {
            cus3.phone = "1111111"
            const res = await senderPut()

            expect(res.status).toBe(400)

        })
        it('should throw if name doesnt fit', async () => {
            cus3.name = "DecoyName1"
            const res = await senderPut()

            expect(res.status).toBe(400)

        })
        it('should throw if isGold is not Boolean', async () => {
            cus3.isGold = "Decoy1"
            const res = await senderPut()

            expect(res.status).toBe(400)

        })
        it('should throw if name is already in db', async () => {
            cus3.name = cus1.name
            const res = await senderPut()

            expect(res.status).toBe(400)

        })
        it('should throw if phone is already in db', async () => {
            cus3.phone = "0" + cus1.phone

            const res = await senderPut()

            expect(res.status).toBe(400)

        })
        it('should update the constomer name in db', async () => {
            const res = await senderPut()

            db = await Customers.findOne({ _id: _id1 }).select({ name: 1 })
            expect("Customer Custer").toMatch(db.name)
        })
        it('should update the constomer isGold in db', async () => {
            const res = await senderPut()

            db = await Customers.findOne({ _id: _id1 }).select({ isGold: 1 })
            expect(db.isGold).toBe(cus3.isGold)
        })
        it('should update the constomer Phone in db', async () => {
            const res = await senderPut()

            db = await Customers.findOne({ _id: _id1 }).select({ phone: 1 })
            expect(cus3.phone).toMatch("0" + db.phone.toString())
        })
        it('should return the updated constomer', async () => {
            const res = await senderPut()

            expect(res.body).toHaveProperty('name')
            expect(res.body).toHaveProperty('isGold')
            expect(res.body).toHaveProperty('phone')
        })
    })
})
