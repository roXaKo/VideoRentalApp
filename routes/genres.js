const express = require('express')
const router = express.Router()
const Joi = require('joi');
const mongoose = require('mongoose')
const { Genre, genreSchema } = require('../models/genresModel')
const auth = require('../middleware/auth')

router.get('/', async (req, res) => {
    const result = await Genre
        .find()
        .sort({ _id: 1 })
        .select({ _id: 1, name: 1 })
    res.send(result)
})

router.get('/:name', async (req, res) => {
    const data = await Genre
        .findOne({ name: req.params.name })
        .select({ _id: 1, name: 1 })

    if (!data) res.status(404).send('this course was not found')
    res.send(data)

})

router.post('/new', auth, async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required()
    })
    let result = schema.validate(req.body)
    
    const exist =await Genre.findOne({ name: req.body.name })
    if (exist) return res.status(400).send('Genre already exists')
    
    if (result.error) return res.status(400).send(result.error)

    const genre = new Genre({
        name: req.body.name
    })
    res.send(await genre.save())
});

router.delete('/:name', auth, async (req, res) => {
    result = await Genre
        .find({ name: req.params.name.toString() })
        .select({ _id: 1 })
    await Genre.deleteMany({ name: req.params.name })
    res.send(`${result._id} has been removed`)
})

router.put('/:name', auth, async (req, res) => {
    const result = await Genre.findOne({ name: req.params.name })
    if(result===null) return res.status(404).send('genre not found')

    result.name = req.body.name
    await result.save()

    res.send(result)
})

module.exports = router;