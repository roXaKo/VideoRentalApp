const request = require("supertest");
const { User } = require("../../../models/userModel");
const bcrypt = require("bcrypt");
const Mongoose = require("mongoose");

describe("auth middleware", () => {
  let server;
  let email;
  let email2;
  let password;
  let password2;
  let name;
  let name2;
  let userId;
  const emailStat = "abc@def.de";
  const passwordStat = "12345678";

  beforeEach(async () => {
    server = require("../../../index");

    name = "someName";
    name2 = "someOtherName";
    email = "abd@def.de";
    email2 = "aba@def.de";
    password = "12345678";
    password2 = "22345678";
    userId = Mongoose.Types.ObjectId();

    let hashpass = await bcrypt.hash(passwordStat, await bcrypt.genSalt(14));

    const user = new User({
      _id: userId,
      name: "someName",
      email: emailStat,
      password: hashpass,
    });
    token = user.generateAuthToken();
    await User.insertMany([user]);
  });
  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  execMe = () => {
    return request(server).get("/api/user/me").set("x-auth-token", token);
  };
  execNew = () => {
    return request(server)
      .post("/api/user")
      .send({ name: name, email: email, password: password });
  };
  execPut = () => {
    return request(server)
      .put("/api/user/me")
      .send({ _id: userId, name: name, email: email, password: password });
  };
  it("should make this suit pass if all other tests of this suit are commented out", () => {});
  describe("/me", () => {
    it("should return 200 if user in db", async () => {
      const res = await execMe();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name");
      expect(res.body).toHaveProperty("email");
    });
    it("should return 500 if valid token without coresponding user in db", async () => {
      token = User().generateAuthToken();
      const res = await execMe();

      expect(res.status).toBe(500);
    });
  });

  describe("POST /", () => {
    it("should return 200 if user is saved", async () => {
      res = await execNew();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email");
      expect(res.body.password).toBe(undefined);
      expect(res.header).toHaveProperty("x-auth-token");
    });
    it("should return 400 if no username or invalid username(Joi)", async () => {
      name = "";
      res = await execNew();
      expect(res.status).toBe(400);

      name = Array(4).join("a");
      res = await execNew();
      expect(res.status).toBe(400);

      name = Array(257).join("a");
      res = await execNew();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no password(Joi)", async () => {
      password = "";
      res = await execNew();
      expect(res.status).toBe(400);

      password = Array(7).join("a");
      res = await execNew();
      expect(res.status).toBe(400);

      password = Array(130).join("a");
      res = await execNew();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no email(Joi)", async () => {
      email = "";
      res = await execNew();
      expect(res.status).toBe(400);

      email = "a@b.";
      res = await execNew();
      expect(res.status).toBe(400);

      email = Array(253).join("a") + "@b.d";
      res = await execNew();
      expect(res.status).toBe(400);

      email = Array(6).join("a");
      res = await execNew();
      expect(res.status).toBe(400);
    });

    it("should return 400 if user email is already in db", async () => {
      email = emailStat;
      res = await execNew();

      expect(res.status).toBe(400);
    });
  });
  describe("PUT /me", () => {
    it("should return 200 if user is saved", async () => {
      res = await execPut();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("email");
      expect(res.body.password).toBe(undefined);
      expect(res.header).toHaveProperty("x-auth-token");
    });
    it("should return 400 if no username or invalid username(Joi)", async () => {
      name = "";
      res = await execPut();
      expect(res.status).toBe(400);

      name = Array(4).join("a");
      res = await execPut();
      expect(res.status).toBe(400);

      name = Array(257).join("a");
      res = await execPut();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no password(Joi)", async () => {
      password = "";
      res = await execPut();
      expect(res.status).toBe(400);

      password = Array(7).join("a");
      res = await execPut();
      expect(res.status).toBe(400);

      password = Array(130).join("a");
      res = await execPut();
      expect(res.status).toBe(400);
    });

    it("should return 400 if no email(Joi)", async () => {
      email = "";
      res = await execPut();
      expect(res.status).toBe(400);

      email = "a@b.";
      res = await execPut();
      expect(res.status).toBe(400);

      email = Array(253).join("a") + "@b.d";
      res = await execPut();
      expect(res.status).toBe(400);

      email = Array(6).join("a");
      res = await execPut();
      expect(res.status).toBe(400);
    });

    it("should return 400 if user email is already in db", async () => {
      await User.insertMany({email: email, password: password, name:name})
      res = await execPut();

      expect(res.status).toBe(400);
    });
  });
});
