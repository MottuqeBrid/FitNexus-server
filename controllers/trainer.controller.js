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
    const trainer = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(id) });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    await db
      .collection("users")
      .findOneAndUpdate({ email: trainer.email }, { $set: { role: "member" } });
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
  const { email, ...updateData } = req.body;
  try {
    const db = getDB();
    const result = await db
      .collection("applied_trainers")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    await db.collection("users").updateOne(
      { email: email },
      {
        $set: {
          role: updateData?.status === "approved" ? "trainer" : "member",
        },
      }
    );
    res.status(200).json({ message: "Updated successfully", result });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

// GET trainer by email
const getTrainerByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const db = getDB();
    const trainer = await db.collection("applied_trainers").findOne({ email });
    if (!trainer) return res.status(404).json({ message: "Trainer not found" });
    res.json(trainer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching trainer", error: err.message });
  }
};

const AllPublicTrainer = async (req, res) => {
  try {
    const db = getDB();
    const { page = 1, limit = 6, search = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery = { status: "approved" };

    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { "skills.label": { $regex: search, $options: "i" } },
        { "skills.value": { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalTrainers = await db
      .collection("applied_trainers")
      .countDocuments(searchQuery);

    // Get paginated trainers
    const trainers = await db
      .collection("applied_trainers")
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalPages = Math.ceil(totalTrainers / limitNum);

    res.json({
      trainers,
      totalPages,
      totalTrainers,
      currentPage: pageNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch trainers", error: err.message });
  }
};

const trainerBookedAndPayment = async (req, res) => {
  const { email } = req.params;
  const db = getDB();

  try {
    const payments = await db.collection("payments").find({ email }).toArray();

    if (payments.length === 0) {
      return res.json({ payments: [], trainers: [] });
    }

    const trainers = await Promise.all(
      payments.map(async (payment) => {
        const trainerId = new ObjectId(payment.trainerId);
        return await db
          .collection("applied_trainers")
          .findOne({ _id: trainerId });
      })
    );

    res.json({ payments, trainers });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching payment and trainer data",
      error: err.message,
    });
  }
};
module.exports = {
  getAllTrainers,
  getTrainerById,
  deleteTrainerById,
  AllPublicTrainer,
  getTrainerByEmail,
  updateTrainer,
  trainerBookedAndPayment,
};
