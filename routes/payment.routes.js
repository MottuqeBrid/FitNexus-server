const express = require("express");
const { ObjectId } = require("mongodb");
const Stripe = require("stripe");
const router = express.Router();
require("dotenv").config();

const { getDB } = require("../db/connect");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/stripe", async (req, res) => {
  const amountInCents = parseInt(req.body.amountInCents);

  if (!amountInCents || amountInCents < 50) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save payment info after successful Stripe payment
router.post("/history", async (req, res) => {
  const db = getDB();
  const payment = req.body;
  const { trainerId } = payment;

  // Update class enrollment for the trainer
  try {
    await db
      .collection("applied_trainers")
      .updateOne({ _id: new ObjectId(trainerId) }, { $inc: { enrolled: 1 } });
    const trainer = await db
      .collection("applied_trainers")
      .findOne({ _id: new ObjectId(trainerId) });
    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }
    await db
      .collection("classes")
      .updateOne(
        { trainerEmail: trainer.email },
        { $inc: { enrolled: 1 }, $set: { updatedAt: new Date() } }
      );
  } catch (error) {
    console.error("Error updating class enrollment:", error);
    res.status(500).json({
      error: "Failed to update class enrollment",
      message: error.message,
    });
  }

  try {
    // Save payment to payments collection
    const result = await db.collection("payments").insertOne({
      ...payment,
      createdAt: new Date(),
      status: "completed",
    });

    res.status(201).json({
      message: "Payment saved successfully and class enrollment updated",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving payment:", error);
    res.status(500).json({
      error: "Failed to save payment",
      message: error.message,
    });
  }
});

module.exports = router;
