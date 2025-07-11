const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connect");

// GET /classes
router.get("/", async (req, res) => {
  const db = getDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  const query = {
    $or: [
      { className: { $regex: search, $options: "i" } },
      { trainerName: { $regex: search, $options: "i" } },
    ],
  };

  try {
    const total = await db.collection("classes").countDocuments(query);
    const classes = await db
      .collection("classes")
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({ classes, total, page, limit });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});

// POST /classes - add a new class
router.post("/", async (req, res) => {
  const db = getDB();
  const classData = req.body;

  if (!classData || !classData.className || !classData.trainerName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await db.collection("classes").insertOne({
      ...classData,
      enrolled: 0,
    });

    res.status(201).json({
      message: "Class added successfully",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("Failed to add class:", err);
    res.status(500).json({ error: "Failed to add class" });
  }
});

module.exports = router;
