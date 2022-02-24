const express = require("express");
const router = express.Router();
const { Movie } = require("../models/movieModel");
const { Rents } = require("../models/rentsModel");

const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
  const rentalId = req.body._id;

  if (!rentalId) return res.status(400).send("no vailid rentalId provided");

  let rent = await Rents.findById(rentalId);

  if (!rent) return res.status(404).send("no rent found");
  if (rent.dateReturned)
    return res.status(400).send("rental already processed");

  rent.return();
  await rent.save();

  let movie = await Movie.findOne({ _id: rent.title._id }).select({
    numberInStock: 1,
  });
  movie.numberInStock += 1;
  await movie.save();

  res.send(rent);
});

module.exports = router;
