// routes/trainer.routes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../db/connect");
const {
  getAllTrainers,
  getTrainerById,
  deleteTrainerById,
  updateTrainer,
} = require("../controllers/trainer.controller");

router.post("/apply", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("applied_trainers").insertOne(req.body);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error applying as trainer", error: err.message });
  }
});

// GET all trainer applications
router.get("/applied", getAllTrainers);

// GET one trainer by ID
router.get("/apply/:id", getTrainerById);

// DELETE a trainer application
router.delete("/apply/:id", deleteTrainerById);

// PUT update trainer info (optional)
router.put("/apply/:id", updateTrainer);

module.exports = router;
