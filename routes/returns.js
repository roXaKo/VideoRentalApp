const express = require('express');
const router = express.Router()
const { Movie } = require('../models/movieModel')
const { Rents } = require('../models/rentsModel')

const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
    const movieId = req.body.title
    const customerId = req.body.customerId

    if (!movieId) return res.status(400).send('no vailid movieId provided')
    if (!customerId) return res.status(400).send('no vail id customerId  provided')

    let rent = await Rents.lookup(customerId, movieId,{  title: 1, dateOut: 1, dateReturned: 1 })
    if (!rent) return res.status(404).send('no rent found')
    if (rent.dateReturned) return res.status(400).send('rental already processed')
    
    rent.return()
    await rent.save()

    let movie = await Movie.findOne({ _id: movieId }).select({numberInStock:1})
    movie.numberInStock += 1
    await movie.save()

    res.send(rent)

})

module.exports = router
