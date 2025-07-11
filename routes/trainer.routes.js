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
const { ObjectId } = require("mongodb");

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

// GET: All public trainers (approved only)
router.get("/public", async (req, res) => {
  try {
    const db = getDB();
    const trainers = await db
      .collection("applied_trainers")
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(trainers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch trainers", error: err.message });
  }
});

// GET: Trainer details by ID (for details page)
router.get("/public/:id", async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;

    const trainer = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(id), status: "approved" });

    if (!trainer) {
      return res
        .status(404)
        .json({ message: "Trainer not found or not approved" });
    }

    res.json(trainer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching trainer", error: err.message });
  }
});
// 🔍 GET all classes by trainer email
router.get("/classes/:email", async (req, res) => {
  const db = getDB();
  const email = req.params.email;

  try {
    const classes = await db
      .collection("applied_trainers") // or your actual class collection name
      .find({ email, status: "approved" }) // match classes created by this trainer
      .toArray();

    res.json(classes);
  } catch (err) {
    res.status(500).json({
      message: "Failed to get classes",
      error: err.message,
    });
  }
});

// update trainer slot by id
router.put("/classes/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { slot } = req.body;

  try {
    const result = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    if (!result.slots) {
      result.slots = [slot];
    } else {
      result.slots.push(slot);
    }

    const updateRes = await db
      .collection("applied_trainers")
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...result } });
    res.status(200).json({ message: "Updated successfully", updateRes });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

module.exports = router;
