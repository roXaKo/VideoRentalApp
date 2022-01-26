const Joi = require('joi');
const mongoose = require('mongoose')

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

const Genre = mongoose.model('Genres', genreSchema)

exports.Genre = Genre;
module.exports.genreSchema = genreSchema
