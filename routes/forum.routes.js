// forum.routes.js
const express = require("express");
const { getDB } = require("../db/connect");
const { ObjectId } = require("mongodb");
const router = express.Router();

// GET paginated forum posts with optional author filter
router.get("/posts", async (req, res) => {
  const db = getDB();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const author = req.query.author; // Filter by author email
  const skip = (page - 1) * limit;

  try {
    // Build query - filter by author if provided
    let query = {};
    if (author) {
      query.authorEmail = author;
    }

    const posts = await db
      .collection("forum_posts")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("forum_posts").countDocuments(query);

    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to load forum posts", error: err.message });
  }
});

// POST a new forum post
router.post("/posts", async (req, res) => {
  const db = getDB();
  const post = {
    ...req.body,
    votes: 0,
    voters: [], // track who voted
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await db.collection("forum_posts").insertOne(post);
    res.json({
      success: true,
      insertedId: result.insertedId,
      message: "Post created successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add forum post", error: err.message });
  }
});

// PATCH: Vote (up/down) on a post
router.patch("/vote/:postId", async (req, res) => {
  const db = getDB();
  const { postId } = req.params;
  const { userId, voteType } = req.body; // voteType = "up" or "down"

  try {
    const post = await db
      .collection("forum_posts")
      .findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.voters.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You already voted on this post" });
    }

    const voteChange = voteType === "up" ? 1 : -1;

    const result = await db.collection("forum_posts").updateOne(
      { _id: new ObjectId(postId) },
      {
        $inc: { votes: voteChange },
        $push: { voters: userId },
      }
    );

    res.json({ success: result.modifiedCount > 0 });
  } catch (err) {
    res.status(500).json({ message: "Failed to vote", error: err.message });
  }
});

// PATCH: Update a forum post
router.patch("/posts/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const updateData = {
    ...req.body,
    updatedAt: new Date(),
  };

  try {
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    const result = await db
      .collection("forum_posts")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "No changes made to post" });
    }

    res.json({
      success: true,
      message: "Post updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update forum post", error: err.message });
  }
});

// DELETE: Delete a forum post
router.delete("/posts/:id", async (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post ID" });
    }

    // Check if post exists
    const post = await db
      .collection("forum_posts")
      .findOne({ _id: new ObjectId(id) });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const result = await db
      .collection("forum_posts")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: "Failed to delete post" });
    }

    res.json({
      success: true,
      message: "Post deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete forum post", error: err.message });
  }
});

module.exports = router;
