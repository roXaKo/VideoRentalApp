const express = require('express');
const router = express.Router()
const Joi = require('joi');
const Mongoose = require('mongoose');
const { Customers } = require('../models/customerModel');
const { Movie } = require('../models/movieModel')
const { Rents } = require('../models/rentsModel')
const auth = require('../middleware/auth');
const res = require('express/lib/response');


async function querryCust(sendNam) {
    const custId = await Customers.findOne({ _id: sendNam }).select({ _id: 1, name: 1, phone: 1 })
    if (custId === null) return ""
    return custId
}
async function querryMovie(sendTit) {
    const movId = await Movie.findById(sendTit).select({ _id: 1, title: 1, dailyRentalRate: 1, numberInStock: 1 })
    if (movId === null) return ""
    return movId
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

    let cust = await querryCust(req.body.customer)
    let movi = await querryMovie(req.body.movie)
    if (!cust) return res.status(404).send('customer not found')
    if (!movi == true) return res.status(404).send('movie not found')
    if (movi.numberInStock == 0) return res.status(400).send('not enugth movies in stock')
    const rent = new Rents({
        customer: cust,
        title: movi
    })
    const movNu = await Movie.findById(req.body.movie).select({ _id: 1, numberInStock: 1 })
    movNu.numberInStock -= 1
    await Movie.findByIdAndUpdate(movNu._id, movNu)
    await rent.save()
    res.send(rent)

})

router.delete('/:customer/:movie', auth, async (req, res) => {
    if (!Mongoose.isValidObjectId(req.params.customer) || !Mongoose.isValidObjectId(req.params.movie)) return res.status(400).send('send data not valid')

    const result = await Rents.findOne({ "customer._id": req.params.customer, "title._id": req.params.movie }).select({ _id: 1 })

    if (result === null) return res.status(404).send('rental not found')
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
        result.customer = await querryCust(req.body.customer)
    }
    if (req.body.title) {
        if (!Mongoose.isValidObjectId(req.body.title)) return res.status(400).send('send data not valid')

        result.title = await querryMovie(req.body.title)
        let movNuIn = await Movie.findById( req.params.movie ).select({ _id: 1, numberInStock: 1 })
        movNuIn.numberInStock += 1
        await Movie.findByIdAndUpdate(movNuIn._id, movNuIn)

        let movNuOut = await Movie.findById(req.body.title).select({ _id: 1, numberInStock: 1 })
        if(movNuOut.numberInStock===0) return res.status(400).send('the movie is not in stock')
        movNuOut.numberInStock -= 1
        await Movie.findByIdAndUpdate(movNuOut._id, movNuOut)
    }
    await Rents.findByIdAndUpdate(result._id, result)

    res.send(result)
})

module.exports = router