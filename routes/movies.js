const express = require("express");
const { string } = require("joi");
const router = express.Router();
const Joi = require("joi");
const Mongoose = require("mongoose");
const { Genre } = require("../models/genresModel");
const { Movie } = require("../models/movieModel");
const auth = require("../middleware/auth");

// all
router.get("/", async (req, res) => {
  res.send(await Movie.find().sort({ title: 1 }));
});
// single
router.get("/:_id", async (req, res) => {
  const data = await Movie.findById(req.params._id);
  if (!data) return res.status(404).send();

  res.send(data);
});

router.post("/new", auth, async (req, res) => {
  const postSchema = Joi.object({
    title: Joi.string().required(),
    genre: Joi.string().required(),
    numberInStock: Joi.number().required(),
    dailyRentalRate: Joi.number().required(),
  });

  const valid = postSchema.validate(req.body);
  if (valid.error) return res.status(400).send(valid.error.message);

  let gen;
  gen = await Genre.findById(req.body.genre);
  if (gen === null) res.status(400).send("selected genre doesnt exist");

  const db = await Movie.findOne({ title: req.body.title });
  if (db) return res.status(400).send("movie already in database");

  const movie = new Movie({
    title: req.body.title,
    genre: {
      _id: req.body.genre,
      name: gen.name,
    },
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate,
  });

  res.send(await movie.save());
});

router.delete("/:_id", auth, async (req, res) => {
  const result = await Movie.findById(req.params._id).select({ _id: 1 });
  if (result === null) return res.status(404).send("movie not found");
  await Movie.findByIdAndDelete(result);

  res.send(`The following Movie has been deleted: ${result}`);
});

router.put("/:_id", auth, async (req, res) => {
  const postSchema = Joi.object({
    _id: Joi.string(),
    title: Joi.string(),
    genre: Joi.string(),
    numberInStock: Joi.number(),
    dailyRentalRate: Joi.number(),
  });

  const valid = postSchema.validate(req.body);
  if (valid.error) return res.status(400).send(valid.error.message);

  const duplicate = await Movie.findOne({ title: req.body.title });
  if (duplicate !== null && duplicate._id !== req.params._id)
    return res.status(400).send("title already exists");

  let result = await Movie.findById(req.params._id).select({
    title: 1,
    genre: 1,
    numberInStock: 1,
    dailyRentalRate: 1,
  });
  if (result === null) return res.status(404).send("movie not found");

  if (req.body.title) {
    result.title = req.body.title;
  }
  if (req.body.genre) {
    let gen;
    gen = await Genre.findById(req.body.genre);
    if (gen === null) res.status(400).send("selected genre doesnt exist");

    result.genre._id = req.body.genre;
    result.genre.name = gen.name;
  }
  if (req.body.numberInStock) {
    result.numberInStock = req.body.numberInStock;
  }
  if (req.body.dailyRentalRate) {
    result.dailyRentalRate = req.body.dailyRentalRate;
  }
  await Movie.findByIdAndUpdate(result._id, result);
  res.send(result);
});

module.exports = router;
