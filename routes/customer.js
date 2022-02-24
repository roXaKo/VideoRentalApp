const express = require("express");
const router = express.Router();
const { Customers } = require("../models/customerModel.js");
const auth = require("../middleware/auth");
const Joi = require("joi");

router.get("/", async (req, res) => {
  res.send(
    await Customers.find()
      .select({ name: 1, _id: 1, phone: 1, isGold: 1 })
      .sort({ _id: 1 })
  );
});

router.get("/:_id", async (req, res) => {
  const data = await Customers.findOne({ _id: req.params._id });
  if (!data) return res.status(404).send();

  res.send(data);
});

router.post("/new", auth, async (req, res) => {
  if (!req.body.name) res.status(400).send("no name send");
  if (!req.body.phone) res.status(400).send("no phoneNr send");

  const patternName = /[A-Z][a-z]* [A-Z][a-z]*/;
  const patternPhone = /[0][0-9]{3,4}[0-9]*/;

  let custSchema = Joi.object({
    name: Joi.string().regex(patternName).required(),
    phone: Joi.string().regex(patternPhone).required(),
  }).unknown();

  const valid = custSchema.validate(req.body);
  if (valid.error) return res.status(400).send(valid.error.message);

  let name = req.body.name;
  let phone = req.body.phone;
  if (await Customers.findOne({ name: name }))
    return res.status(400).send("name already exists");
  if (await Customers.findOne({ phone: phone }))
    return res.status(400).send("phoneNr already exists");

  const cus = new Customers({
    isGold: req.body.isGold,
    name: name,
    phone: phone,
  });
  await cus.save();
  res.send(cus);
});

router.delete("/:_id", auth, async (req, res) => {
  const result = await Customers.findById(req.params._id).select({ _id: 1 });
  if (!result) res.status(404).send("no customer wit this id found");

  await Customers.findByIdAndDelete(result);
  res.send(`The following customer has been deleted: ${result}`);
});

router.put("/:_id", auth, async (req, res) => {
  const patternName = /[A-Z][a-z]* [A-Z][a-z]*/;
  const patternPhone = /[0][0-9]{3,4}[0-9]*/;

  let custSchema = Joi.object({
    name: Joi.string().regex(patternName),
    phone: Joi.string().regex(patternPhone),
  }).unknown();

  const valid = custSchema.validate(req.body);
  if (valid.error) return res.status(400).send(valid.error.message);

  let phone = req.body.phone;
  let name = req.body.name;
  let isGold = req.body.isGold;

  let result = await Customers.findById(req.params._id).select({
    name: 1,
    isGold: 1,
    phone: 1,
  });

  const duplicateName = await Customers.findOne({ name: name });
  const duplicatePhone = await Customers.findOne({ phone: phone });

  if (duplicateName !== null && !duplicateName._id.equals(result._id))
    return res.status(400).send("name already exists");

  if (duplicatePhone !== null && !duplicatePhone._id.equals(result._id))
    return res.status(400).send("phoneNr already exists");

  if (typeof isGold !== "boolean" && isGold !== null)
    return res.status(400).send("isGold needs to be true or false");

  if (req.body.name) result.name = name;
  if (req.body.isGold) result.isGold = isGold;
  if (req.body.phone) result.phone = phone;

  await Customers.findOneAndReplace(
    { _id: req.params._id },
    { name: result.name, isGold: result.isGold, phone: result.phone }
  );
  res.send(result);
});

module.exports = router;
