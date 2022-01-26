const logger = require('../middleware/logger')

module.exports = function () {process.on('uncaughtException', (ex) => {
    logger.log("error", { message: ex.message, ex: ex })
    process.exit(1)
})}

module.exports = function () {process.on('unhandledRejection', (ex) => {
    logger.log("error", { message: ex.message, ex: ex })
    process.exit(1)
})}