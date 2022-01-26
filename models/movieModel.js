const mongoose = require('mongoose');
const genreSchema = require('../models/genresModel')

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    genre: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Genres'
        },
        name: { type: String, required: true }
    },
    numberInStock: { type: Number, required: true },
    dailyRentalRate: { type: Number, required: true }

})

const Movie = mongoose.model('Movie', movieSchema)

exports.Movie = Movie
module.exports.movieSchema = movieSchema