const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connect");

// GET /classes with advanced filtering, sorting, and search
router.get("/", async (req, res) => {
  const db = getDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const search = req.query.search || "";
  const status = req.query.status || "all"; // all, active, inactive
  const sortBy = req.query.sortBy || "newest"; // newest, oldest, price-low, price-high, popular, alphabetical
  const priceRange = req.query.priceRange || "all"; // all, 0-50, 50-100, 100+

  try {
    // Build search and filter query
    let query = {};

    // Search functionality - search in className, description, trainerName
    if (search) {
      query.$or = [
        { className: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { trainerName: { $regex: search, $options: "i" } },
        { customTrainerName: { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status !== "all") {
      query.status = status;
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "0-50":
          query.price = { $gte: 0, $lte: 50 };
          break;
        case "50-100":
          query.price = { $gt: 50, $lte: 100 };
          break;
        case "100+":
          query.price = { $gt: 100 };
          break;
      }
    }

    // Build sort options
    let sortOptions = {};
    switch (sortBy) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "price-low":
        sortOptions = { price: 1 };
        break;
      case "price-high":
        sortOptions = { price: -1 };
        break;
      case "popular":
        sortOptions = { likes: -1, enrolled: -1 };
        break;
      case "alphabetical":
        sortOptions = { className: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalClasses = await db.collection("classes").countDocuments(query);
    const totalPages = Math.ceil(totalClasses / limit);

    // Get paginated and sorted classes
    const classes = await db
      .collection("classes")
      .find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      classes,
      totalPages,
      totalClasses,
      currentPage: page,
      filters: {
        search,
        status,
        sortBy,
        priceRange,
      },
    });
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({
      error: "Failed to fetch classes",
      message: err.message,
    });
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

// GET /classes/:id - get single class details
router.get("/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid class ID" });
    }

    const classData = await db
      .collection("classes")
      .findOne({ _id: new ObjectId(id) });

    if (!classData) {
      return res.status(404).json({ error: "Class not found" });
    }

    res.json(classData);
  } catch (err) {
    console.error("Error fetching class details:", err);
    res.status(500).json({
      error: "Failed to fetch class details",
      message: err.message,
    });
  }
});

// GET /classes/by-trainer/:trainerId - get classes by trainer
router.get("/by-trainer/:trainerId", async (req, res) => {
  const db = getDB();
  const { trainerId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    // Validate ObjectId
    if (!ObjectId.isValid(trainerId)) {
      return res.status(400).json({ error: "Invalid trainer ID" });
    }

    const query = { selectedTrainer: trainerId };

    const totalClasses = await db.collection("classes").countDocuments(query);
    const totalPages = Math.ceil(totalClasses / limit);

    const classes = await db
      .collection("classes")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({
      classes,
      totalPages,
      totalClasses,
      currentPage: page,
      trainerId,
    });
  } catch (err) {
    console.error("Error fetching trainer classes:", err);
    res.status(500).json({
      error: "Failed to fetch trainer classes",
      message: err.message,
    });
  }
});

router.get("/home/featured-classes", async (req, res) => {
  const db = getDB();
  try {
    const classes = await db
      .collection("classes")
      .find({ status: "active" }) // Only show active classes
      .sort({ enrolled: -1, likes: -1 }) // Sort by enrollment and likes
      .limit(6)
      .toArray();

    res.json(classes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching featured classes", error: err.message });
  }
});

module.exports = router;
