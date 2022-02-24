const mongoose = require('mongoose')
const logger = require('../middleware/logger')
const config = require('config')

module.exports = function () {
    mongoose.connect(config.get('db'))
        .then(() => {logger.info(  `${new Date} Connected to ${config.get('db')}`)})
}