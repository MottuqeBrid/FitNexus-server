const express = require("express");
const { getDB } = require("../db/connect");
const {
  registerUser,
  getUserRole,
  updateLogin,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/user.controller");
const { verifyFireBaseToken } = require("../firebase/firebase");

const router = express.Router();

router.post("/register", registerUser);
router.get("/role/:email", verifyFireBaseToken, getUserRole);
router.patch("/update/login", updateLogin);

// Profile management routes
router.get("/profile/:email", verifyFireBaseToken, getUserProfile);
router.patch("/profile/:email", verifyFireBaseToken, updateUserProfile);

router.get("/", async (req, res) => {
  try {
    const db = await getDB();
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
