const express = require("express");
const { getDB } = require("../db/connect");
const { registerUser, getUserRole } = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", registerUser);
router.get("/role/:email", getUserRole);

router.get("/", async (req, res) => {
  try {
    const db = await getDB();
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
