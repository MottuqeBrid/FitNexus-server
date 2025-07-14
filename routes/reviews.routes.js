const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../db/connect");
const router = express.Router();

router.post("/add", async (req, res) => {
  const db = getDB();
  const {
    rating,
    comment,
    bookingId,
    trainerId,
    trainerName,
    userEmail,
    userName,
    userPhoto,
    createdAt,
  } = req.body;

  // Validate required fields
  if (
    !rating ||
    !comment ||
    !bookingId ||
    !trainerId ||
    !trainerName ||
    !userEmail ||
    !userName
  ) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const review = {
      rating: Number(rating),
      comment,
      bookingId: new ObjectId(bookingId),
      trainerId: new ObjectId(trainerId),
      trainerName,
      userEmail,
      userName,
      userPhoto: userPhoto || null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      reviewId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: err.message,
    });
  }
});

router.get("/by-trainer/:trainerId", async (req, res) => {
  const db = getDB();
  const { trainerId } = req.params;

  if (!ObjectId.isValid(trainerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid trainer ID",
    });
  }

  try {
    const reviews = await db
      .collection("reviews")
      .find({ trainerId: new ObjectId(trainerId) })
      .sort({ createdAt: -1 }) // optional: newest first
      .toArray();

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: err.message,
    });
  }
});

module.exports = router;
