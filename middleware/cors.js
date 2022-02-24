const cors = require("cors");
const {origin} = require("../config/default.json")

const corsOptions = {
  origin: origin,
  optionSuccessStatus: 204,
  preflightContinue: true,
  methods: ["GET", "PUT", "POST", "DELETE"],
  exposedHeaders: ["x-auth-token","content-type"],
  allowedHeaders: ["x-auth-token","content-type"],
};

module.exports = cors(corsOptions);
