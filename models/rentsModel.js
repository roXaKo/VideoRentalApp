const Joi = require('joi');
const Mongoose = require('mongoose');
const movieSchema = require('./movieModel')
const customerSchema = require('./customerModel');
const moment = require('moment')

const rentalSchema = new Mongoose.Schema({
    customer: {
        name: String,
        phone: String,
        isGold: String,
        _id: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        }
    },
    title: {
        title: String,
        dailyRentalRate: Number,
        numberInStock: Number,
        _id: {
            type: Mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
            required: true
        }
    },
    dateOut: {
        type: Date,
        default: new Date
    },
    dateReturned: {
        type: Date,
    },
    rentalFee: Number
})

rentalSchema.statics.lookup = function lookup(customerId, movieId, select) {
    return this.findOne({
        "customer._id": customerId,
        "title._id": movieId
    })
        .select(select)
}

rentalSchema.methods.return = function () {
    this.dateReturned = new Date

    this.rentalFee = moment().diff(this.dateOut, "days") * this.title.dailyRentalRate
}

const Rents = Mongoose.model('Rents', rentalSchema)

exports.Rents = Rents