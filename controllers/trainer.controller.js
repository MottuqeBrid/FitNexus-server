const { getDB } = require("../db/connect");
const { ObjectId } = require("mongodb");

// GET all applied trainers
const getAllTrainers = async (req, res) => {
  try {
    const db = getDB();
    const trainers = await db.collection("applied_trainers").find().toArray();
    res.json(trainers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch trainers", error: err.message });
  }
};

// GET trainer details by ID
const getTrainerById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDB();
    const trainer = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(id) });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    res.json(trainer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching trainer", error: err.message });
  }
};

// DELETE trainer by ID
const deleteTrainerById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDB();

    const result = await db
      .collection("applied_trainers")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Trainer not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting trainer", error: err.message });
  }
};

// (Optional) PUT - Update trainer
const updateTrainer = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    const db = getDB();
    const result = await db
      .collection("applied_trainers")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    await db
      .collection("users")
      .updateOne({ email: updateData.email }, { $set: { role: "trainer" } });
    res.status(200).json({ message: "Updated successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

module.exports = {
  getAllTrainers,
  getTrainerById,
  deleteTrainerById,
  updateTrainer,
};
