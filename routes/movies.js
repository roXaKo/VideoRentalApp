const express = require('express');
const { string } = require('joi');
const router = express.Router()
const Joi = require('joi');
const Mongoose = require('mongoose');
const { Genre } = require('../models/genresModel');
const { Movie } = require('../models/movieModel')
const auth = require('../middleware/auth')

async function querryGenre(sendTit) {
    const genId = await Genre.findOne({ name: sendTit }).select({ _id: 1 })
    return genId
}

// all
router.get('/', async (req, res) => {
    res.send(await Movie.find().select({ title: 1, _id: 1, genre: 1, numberInStock: 1, dailyRentalRate: 1 }).sort({ title: 1 }))
})
// single
router.get('/:title', async (req, res) => {
    res.send(await Movie.findOne({ title: req.params.title }))
})

router.post('/new', auth, async (req, res) => {
    const postSchema = Joi.object({
        title: Joi.string().required(),
        genre: Joi.string().required(),
        numberInStock: Joi.number().required(),
        dailyRentalRate: Joi.number().required()
    })

    const valid = postSchema.validate(req.body)
    if (valid.error) return res.status(400).send(valid.error.message)

    let genId
    genId = await querryGenre(req.body.genre)
    if (genId === null) res.status(400).send('selected genre doesnt exist')

    const db = await Movie.findOne({ title: req.body.title })
    if (db) return res.status(400).send('movie already in database')

    const movie = new Movie({
        title: req.body.title,
        genre: {
            _id: genId,
            name: req.body.genre
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    })

    res.send(await movie.save())
})

router.delete('/:title', auth, async (req, res) => {
    const result = await Movie.findOne({ title: req.params.title }).select({ _id: 1 })
    if (result === null) return res.status(404).send('movie not found')
    await Movie.findByIdAndDelete(result)

    res.send(`The following Movie has been deleted: ${result}`)
})

router.put('/:title', auth, async (req, res) => {
    const postSchema = Joi.object({
        title: Joi.string(),
        genre: Joi.string(),
        numberInStock: Joi.number(),
        dailyRentalRate: Joi.number()
    })

    const valid = postSchema.validate(req.body)
    if (valid.error) return res.status(400).send(valid.error.message)

    if(await Movie.findOne({title: req.body.title})!==null) return res.status(400).send('title already exists')

    let result = await Movie.findOne({ title: req.params.title }).select({ title: 1, genre: 1, numberInStock: 1, dailyRentalRate: 1 })
    if(result===null)return res.status(404).send('movie not found')
    
    if (req.body.title) { result.title = req.body.title }
    if (req.body.genre) {
        let genId
        genId = await querryGenre(req.body.genre)
        if (genId === null) res.status(400).send('selected genre doesnt exist')

        result.genre._id = genId;
        result.genre.name = req.body.genre
    }
    if (req.body.numberInStock) { result.numberInStock = req.body.numberInStock }
    if (req.body.dailyRentalRate) { result.dailyRentalRate = req.body.dailyRentalRate }
    await Movie.findByIdAndUpdate(result._id, result)
    res.send(result)

})

module.exports = router