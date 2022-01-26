const winston = require('winston')
const logger = require('./logger')


module.exports = async function (err, req, res, next) {
        logger.log("error", {atime: new Date, mss: err.message, err: err, stack: err.stack })
        res.status(500).send('Something failed')
}