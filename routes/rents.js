const express = require('express');
const router = express.Router()
const Joi = require('joi');
const Mongoose = require('mongoose');
const { Customers } = require('../models/customerModel');
const { Movie } = require('../models/movieModel')
const { Rents } = require('../models/rentsModel')
const auth = require('../middleware/auth');
const res = require('express/lib/response');


async function querryCust(sendNam, select) {
    const custId = await Customers.findOne({ _id: sendNam }).select(select)
    if (custId === null) return ""
    return custId
}

// all
router.get('/', async (req, res) => {
    res.send(await Rents.find().populate('customer', 'name').populate('title', 'title').sort({ customer: 1 }))
})
// single
router.get('/:_id', async (req, res) => {
    res.send(await Rents.findById(req.params._id).populate('customer', 'name').populate('title', 'name').sort({ title: 1 }))
})

router.post('/new', auth, async (req, res) => {
    if (!Mongoose.isValidObjectId(req.body.customer) || !Mongoose.isValidObjectId(req.body.movie)) return res.status(400).send('send data not valid')

    let cust = await Customers.querry(req.body.customer, { _id: 1, name: 1, phone: 1 })
    if (!cust) return res.status(404).send('customer not found')
    let movi = await Movie.querry(req.body.movie, { _id: 1, title: 1, dailyRentalRate: 1, numberInStock: 1 })
    if (!movi) return res.status(404).send('movie not found')
    if (movi.numberInStock == 0) return res.status(400).send('not enugth movies in stock')

    movi.numberInStock -= 1
    await Movie.findByIdAndUpdate(movi._id, movi)

    const rent = new Rents({
        customer: cust,
        title: movi
    })

    await rent.save()
    res.send(rent)

})

router.delete('/:customer/:movie', auth, async (req, res) => {
    if (!Mongoose.isValidObjectId(req.params.customer) || !Mongoose.isValidObjectId(req.params.movie)) return res.status(400).send('send data not valid')

    const result = await Rents.findOne({ "customer._id": req.params.customer, "title._id": req.params.movie }).select({ _id: 1 })

    if (!result) return res.status(404).send('rental not found')
    await Rents.findByIdAndDelete(result)

    const movNu = await Movie.findById(req.params.movie).select({ _id: 1, numberInStock: 1 })
    movNu.numberInStock += 1
    await Movie.findByIdAndUpdate(movNu._id, movNu)
    res.send(`The following Rent has been deleted: ${result}`)
})

router.put('/:customer/:movie', auth, async (req, res) => {
    if (!Mongoose.isValidObjectId(req.params.customer) || !Mongoose.isValidObjectId(req.params.movie)) return res.status(400).send('send data not valid')

    let result = await Rents.findOne({ "customer._id": req.params.customer, "title._id": req.params.movie })
    if (!result) return res.status(404).send("rental not found")

    if (req.body.customer) {
        if (!Mongoose.isValidObjectId(req.body.customer)) return res.status(400).send('send data not valid')
        result.customer = await Customers.querry(req.body.customer, { _id: 1, name: 1, phone: 1 })
    }
    
    if (req.body.title) {
        if (!Mongoose.isValidObjectId(req.body.title)) return res.status(400).send('send data not valid')

        let movNuIn = await Movie.querry(req.params.movie,{ _id: 1, numberInStock: 1 })
        movNuIn.numberInStock += 1

        result.title = await Movie.querry(req.body.title, { _id: 1, title: 1, dailyRentalRate: 1, numberInStock: 1 })
        if (result.title.numberInStock === 0) return res.status(400).send('the movie is not in stock')
        result.title.numberInStock -= 1

        await Movie.findByIdAndUpdate(movNuIn._id, movNuIn)
        await Movie.findByIdAndUpdate(result.title._id, result.title)
    }
    await Rents.findByIdAndUpdate(result._id, result)

    res.send(result)
})

module.exports = router