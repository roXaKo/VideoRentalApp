const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Mongoose = require("mongoose");
const { Customers } = require("../models/customerModel");
const { Movie } = require("../models/movieModel");
const { Rents } = require("../models/rentsModel");
const auth = require("../middleware/auth");

// all
router.get("/", async (req, res) => {
  res.send(
    await Rents.find()
      .populate("customer", "name")
      .populate("title", "title")
      .sort({ customer: 1 })
  );
});

// all of one customer
router.get("/customer/:id", async (req, res) => {
  let data = await Rents.find({ "customer._id": req.params.id })
    .populate("customer", "name")
    .populate("title", "name");
  if (data.length===0) return res.status(404).send();
  
  res.send(data);
});

// single
router.get("/:_id", async (req, res) => {
  const data = await Rents.findById(req.params._id)
    .populate("customer", "name")
    .populate("title", "name")
    .sort({ title: 1 });
  if (!data) return res.status(404).send();
  res.send(data);
});

router.post("/new", auth, async (req, res) => {
  if (
    !Mongoose.isValidObjectId(req.body.customer._id) ||
    !Mongoose.isValidObjectId(req.body.title._id)
  )
    return res.status(400).send("send data not valid");

  let cust = await Customers.querry(req.body.customer._id, {
    _id: 1,
    name: 1,
    phone: 1,
    isGold: 1,
  });

  if (!cust) return res.status(404).send("customer not found");
  let movi = await Movie.querry(req.body.title._id, {
    _id: 1,
    title: 1,
    dailyRentalRate: 1,
    numberInStock: 1,
    genre: 1,
  });

  if (!movi) return res.status(404).send("movie not found");
  if (movi.numberInStock == 0)
    return res.status(400).send("not enugth movies in stock");

  movi.numberInStock -= 1;
  await Movie.findByIdAndUpdate(movi._id, movi);

  const rent = new Rents({
    customer: cust,
    title: movi,
  });
  console.log(movi)
  await rent.save();
  res.send(rent);
});

router.delete("/:id", auth, async (req, res) => {
  if (!Mongoose.isValidObjectId(req.params.id))
    return res.status(400).send("send data not valid");

  const result = await Rents.findById(req.params.id);
  if (!result) return res.status(404).send("rental not found");

  await Rents.findByIdAndDelete(result);
  await Movie.updateOne(
    { _id: result.title._id },
    { $inc: { numberInStock: 1 } }
  );

  res.send(`The following Rent has been deleted: ${result}`);
});

router.put("/:id", auth, async (req, res) => {
  if (!Mongoose.isValidObjectId(req.params.id))
    return res.status(400).send("send data not valid");

  let result = await Rents.findById(req.params.id);
  if (!result) return res.status(404).send("rental not found");
  const originalMovieId = result.title._id;

  if (result.dateReturned)
    return res.status(400).send("rental allready returned");

  if (!Mongoose.isValidObjectId(req.body.customer._id))
    return res.status(400).send("send data not valid");
  if (!Mongoose.isValidObjectId(req.body.title._id))
    return res.status(400).send("send data not valid");

  result.customer = await Customers.querry(req.body.customer._id, {
    _id: 1,
    name: 1,
    phone: 1,
  });

  result.title = await Movie.querry(req.body.title._id, {
    _id: 1,
    title: 1,
    dailyRentalRate: 1,
    numberInStock: 1,
  });
  if (result.title.numberInStock === 0)
    return res.status(400).send("the movie is not in stock");
  result.title.numberInStock -= 1;

  await Movie.updateOne(
    { _id: originalMovieId },
    { $inc: { numberInStock: 1 } }
  );

  await Movie.findByIdAndUpdate(result.title._id, result.title);

  await Rents.findByIdAndUpdate(result._id, result);

  res.send(result);
});

module.exports = router;
