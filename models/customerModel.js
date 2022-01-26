const Joi = require('joi');
const Mongoose = require('mongoose')

const customerSchema = new Mongoose.Schema({
    isGold: { type: Boolean, default: false },
    name: { type: String, unique: true, require: true, validate: /[A-Z][a-z]* [A-Z][a-z]*/ },
    phone: { type: Number, unique: true, require: true, validate: /[0-9]{3,4}[0-9]*/ }
})

customerSchema.statics.querry = async function querry(sendNam, select){
    const custId = await Customers.findOne({ _id: sendNam }).select(select)
    if (custId === null) return ""
    return custId
}
const Customers = Mongoose.model('Customer', customerSchema)

exports.Customers = Customers
