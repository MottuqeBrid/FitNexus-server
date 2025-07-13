const express = require("express");
const cors = require("cors");
require("dotenv").config();
const newsletterRoutes = require("./routes/newsletter");

const { connectToDatabase, getDB } = require("./db/connect");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Sample Route
app.get("/", (req, res) => {
  res.send("FitNexus Server Running...");
});

// Import routes
app.use("/users", require("./routes/user.routes"));
app.use("/trainers", require("./routes/trainer.routes"));
app.use("/payments", require("./routes/payment.routes"));
app.use("/classes", require("./routes/classes.routes"));
app.use("/forum", require("./routes/forum.routes"));
app.use("/newsletter", newsletterRoutes);
app.use("/forum", require("./routes/forum.routes"));

// GET /api/payments
app.get("/payments", async (req, res) => {
  const db = getDB();
  try {
    const payments = await db.collection("payments").find({}).toArray();
    res.send(payments);
  } catch (err) {
    res.status(500).send({ error: "Failed to fetch payments" });
  }
});

// Start Server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
});
