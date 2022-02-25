const cors = require("cors");
const config = require('config')

const corsOptions = {
  origin: config.get("origin"),
  optionSuccessStatus: 204,
  preflightContinue: true,
  methods: ["GET", "PUT", "POST", "DELETE"],
  exposedHeaders: ["x-auth-token","content-type"],
  allowedHeaders: ["x-auth-token","content-type"],
};

module.exports = cors(corsOptions);
