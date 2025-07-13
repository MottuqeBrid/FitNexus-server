const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connect");

// POST: Subscribe to newsletter
router.post("/", async (req, res) => {
  const db = getDB();
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "Name and email are required." });
  }

  try {
    const existing = await db
      .collection("newsletterSubscribers")
      .findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already subscribed." });
    }

    const result = await db.collection("newsletterSubscribers").insertOne({
      name,
      email,
      subscribedAt: new Date(),
    });

    res
      .status(201)
      .json({ message: "Subscribed successfully", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET: List all subscribers
router.get("/", async (req, res) => {
  const db = getDB();
  try {
    const subscribers = await db
      .collection("newsletterSubscribers")
      .find()
      .sort({ subscribedAt: -1 })
      .toArray();
    res.status(200).json(subscribers);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch subscribers", error: err.message });
  }
});
// DELETE: Unsubscribe by id
router.delete("/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  try {
    const result = await db
      .collection("newsletterSubscribers")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Subscriber not found", ...result });
    }
    res.status(200).json({ message: "Unsubscribed successfully", ...result });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to unsubscribe", error: err.message });
  }
});

module.exports = router;
