const { error } = require('winston')
const winston = require('winston')

const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: "error" }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.File({ filename: 'critical.log', level: "crit" })]
})

module.exports = logger