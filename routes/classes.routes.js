const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connect");

// GET /classes
router.get("/", async (req, res) => {
  const db = getDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const search = req.query.search || "";

  const query = search ? { className: { $regex: search, $options: "i" } } : {};

  try {
    const totalClasses = await db.collection("classes").countDocuments(query);
    const totalPages = Math.ceil(totalClasses / limit);

    const classes = await db
      .collection("classes")
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({ classes, totalPages, totalClasses });
  } catch (err) {
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
      likes: 0,
      dislikes: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      message: "Class added successfully",
      insertedId: result.insertedId,
      _id: result.insertedId,
    });
  } catch (err) {
    console.error("Failed to add class:", err);
    res.status(500).json({ error: "Failed to add class" });
  }
});

// POST /classes/:id/interaction - like or dislike a class
router.post("/:id/interaction", async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { type, userEmail, userName } = req.body;

  // Validate input
  if (!type || !["like", "dislike"].includes(type)) {
    return res.status(400).json({
      error: "Invalid interaction type. Must be 'like' or 'dislike'",
    });
  }

  if (!userEmail || !userName) {
    return res.status(400).json({
      error: "User email and name are required",
    });
  }

  try {
    // Check if class exists
    const classExists = await db
      .collection("classes")
      .findOne({ _id: new ObjectId(id) });

    if (!classExists) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Check if user already has an interaction with this class
    const existingInteraction = await db
      .collection("class_interactions")
      .findOne({ classId: id, userEmail });

    if (existingInteraction) {
      // If same type, remove the interaction (toggle off)
      if (existingInteraction.type === type) {
        await db
          .collection("class_interactions")
          .deleteOne({ classId: id, userEmail });

        // Update class counters (decrement)
        const updateField =
          type === "like"
            ? { $inc: { likes: -1 } }
            : { $inc: { dislikes: -1 } };
        await db
          .collection("classes")
          .updateOne({ _id: new ObjectId(id) }, updateField);

        return res.json({
          message: `${type} removed successfully`,
          action: "removed",
          type,
        });
      } else {
        // Different type, update the interaction
        await db.collection("class_interactions").updateOne(
          { classId: id, userEmail },
          {
            $set: {
              type,
              userName,
              updatedAt: new Date(),
            },
          }
        );

        // Update class counters (increment new, decrement old)
        const oldType = existingInteraction.type;
        const increment =
          type === "like"
            ? { likes: 1, dislikes: -1 }
            : { likes: -1, dislikes: 1 };
        await db
          .collection("classes")
          .updateOne({ _id: new ObjectId(id) }, { $inc: increment });

        return res.json({
          message: `Changed from ${oldType} to ${type}`,
          action: "updated",
          type,
          previousType: oldType,
        });
      }
    } else {
      // New interaction
      await db.collection("class_interactions").insertOne({
        classId: id,
        userEmail,
        userName,
        type,
        createdAt: new Date(),
      });

      // Update class counters (increment)
      const updateField =
        type === "like" ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
      await db
        .collection("classes")
        .updateOne({ _id: new ObjectId(id) }, updateField);

      return res.json({
        message: `${type} added successfully`,
        action: "added",
        type,
      });
    }
  } catch (err) {
    console.error("Error handling class interaction:", err);
    res.status(500).json({
      error: "Failed to process interaction",
      message: err.message,
    });
  }
});

// GET /classes/interactions - get user's interactions with classes
router.get("/interactions", async (req, res) => {
  const db = getDB();
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "User email is required" });
  }

  try {
    const interactions = await db
      .collection("class_interactions")
      .find({ userEmail: email })
      .toArray();

    // Convert to format expected by frontend: { classId: { type: 'like' | 'dislike' } }
    const userInteractions = {};
    interactions.forEach((interaction) => {
      userInteractions[interaction.classId] = {
        type: interaction.type,
        createdAt: interaction.createdAt,
        updatedAt: interaction.updatedAt,
      };
    });

    res.json(userInteractions);
  } catch (err) {
    console.error("Error fetching user interactions:", err);
    res.status(500).json({
      error: "Failed to fetch user interactions",
      message: err.message,
    });
  }
});

// GET /classes/stats - get overall class statistics
router.get("/stats", async (req, res) => {
  const db = getDB();

  try {
    const totalClasses = await db.collection("classes").countDocuments();
    const totalInteractions = await db
      .collection("class_interactions")
      .countDocuments();

    const likeStats = await db
      .collection("class_interactions")
      .aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const stats = {
      totalClasses,
      totalInteractions,
      totalLikes: likeStats.find((stat) => stat._id === "like")?.count || 0,
      totalDislikes:
        likeStats.find((stat) => stat._id === "dislike")?.count || 0,
    };

    res.json(stats);
  } catch (err) {
    console.error("Error fetching class statistics:", err);
    res.status(500).json({
      error: "Failed to fetch statistics",
      message: err.message,
    });
  }
});

module.exports = router;
