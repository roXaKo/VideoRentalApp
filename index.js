const logger = require("./middleware/logger");
require("express-async-errors");
const express = require("express");
const app = express();
const corsMiddleware = require("./middleware/cors")

app.use(corsMiddleware)
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/envVar")();
require("./startup/logging")();
require("./startup/prod")(app);

const port = process.env.PORT || 3900;
const server = app.listen(port, () =>
  logger.info(`listening to port ${port}`)
);

module.exports = server;
