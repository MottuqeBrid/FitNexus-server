// routes/trainer.routes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../db/connect");
const {
  getAllTrainers,
  getTrainerById,
  deleteTrainerById,
  updateTrainer,
  getTrainerByEmail,
  AllPublicTrainer,
  trainerBookedAndPayment,
} = require("../controllers/trainer.controller");
const { ObjectId } = require("mongodb");
const { verifyFireBaseToken } = require("../firebase/firebase");

router.post("/apply", verifyFireBaseToken, async (req, res) => {
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
router.get("/applied", verifyFireBaseToken, getAllTrainers);

// GET one trainer by ID
router.get("/apply/:id", verifyFireBaseToken, getTrainerById);
router.get("/apply/byEmail/:email", verifyFireBaseToken, getTrainerByEmail);

// DELETE a trainer application
router.delete("/apply/:id", verifyFireBaseToken, deleteTrainerById);

// PUT update trainer info (optional)
router.put("/apply/:id", verifyFireBaseToken, updateTrainer);

// GET: All public trainers (approved only) with pagination and search
router.get("/public", verifyFireBaseToken, AllPublicTrainer);
router.get("/byUser/:email", verifyFireBaseToken, trainerBookedAndPayment);

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

// DELETE a slot
router.delete("/slots/:slotId", verifyFireBaseToken, async (req, res) => {
  const { slotId } = req.params;
  const db = getDB();

  try {
    const result = await db
      .collection("applied_trainers")
      .updateOne({ "slots.slotId": slotId }, { $pull: { slots: { slotId } } });

    if (result.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "Slot not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// update trainer slot by id
router.put("/classes/:id", verifyFireBaseToken, async (req, res) => {
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

// Route: PATCH /update-slots/:id

router.patch("/update-slots/:id", async (req, res) => {
  const db = getDB();
  const trainerId = req.params.id;
  const { slots } = req.body;

  if (!slots || !Array.isArray(slots)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid slots data." });
  }

  try {
    const result = await db
      .collection("applied_trainers")
      .updateOne({ _id: new ObjectId(trainerId) }, { $set: { slots } });

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trainer not found." });
    }

    res.json({
      success: true,
      message: "Slots updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Failed to update slots:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
});

// PATCH: Add slots to trainer profile
router.patch("/add-slots/:id", verifyFireBaseToken, async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { slots } = req.body;

    // Validate input
    if (!slots || !Array.isArray(slots)) {
      return res.status(400).json({
        message: "Slots array is required",
      });
    }

    // Find the trainer
    const trainer = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(id) });

    if (!trainer) {
      return res.status(404).json({
        message: "Trainer not found",
      });
    }

    // Prepare slots with proper structure and validation
    const newSlots = slots.map((slot) => ({
      slotId: new ObjectId().toString(),
      slotName: slot.slotName || `${slot.className} - ${slot.day} ${slot.time}`,
      day: slot.day,
      time: slot.time,
      className: slot.className,
      classId: slot.classId,
      isBooked: slot.isBooked || false,
      price: parseFloat(slot.price) || 0,
      capacity: parseInt(slot.capacity) || 1,
      bookedBy: slot.bookedBy || [],
      createdAt: slot.createdAt || new Date(),
      updatedAt: new Date(),
    }));

    // Initialize slots array if it doesn't exist, or append to existing
    const existingSlots = trainer.slots || [];
    const updatedSlots = [...existingSlots, ...newSlots];

    // Update trainer with new slots
    const result = await db.collection("applied_trainers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          slots: updatedSlots,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({
        message: "Failed to update trainer slots",
      });
    }

    res.status(200).json({
      message: "Slots added successfully",
      addedSlots: newSlots.length,
      totalSlots: updatedSlots.length,
      trainer: {
        id: trainer._id,
        name: trainer.fullName,
        email: trainer.email,
      },
    });
  } catch (err) {
    console.error("Error adding slots to trainer:", err);
    res.status(500).json({
      message: "Failed to add slots to trainer",
      error: err.message,
    });
  }
});

module.exports = router;
