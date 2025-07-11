const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectToDatabase } = require("./db/connect");

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

// POST /api/newsletter
app.post("/newsletter", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).send("Missing fields");

  try {
    const result = await newsletterCollection.insertOne({
      name,
      email,
      subscribedAt: new Date(),
    });
    res.status(201).send(result);
  } catch (err) {
    res.status(500).send({ error: "Failed to save to DB" });
  }
});

// Start Server
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
});
