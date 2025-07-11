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
  try {
    const result = await db.collection("payments").insertOne(payment);
    res.status(201).json({
      message: "Payment saved successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to save payment" });
  }
  //   res.status(200).json({ message: "Payment saved successfully" });
});

module.exports = router;
