const { getDB } = require("../db/connect");

const registerUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL, role, createdAt, lastLogin } = req.body;

    const db = getDB();
    const userExists = await db.collection("users").findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists", userId: userExists._id });
    }

    const result = await db.collection("users").insertOne({
      uid,
      name,
      email,
      photoURL,
      role: role || "member", // Default to 'member' if role is not provided
      createdAt,
      lastLogin,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// Get user role by email
const getUserRole = async (req, res) => {
  try {
    const email = req.params.email;
    const db = getDB();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({ role: null, message: "User not found" });
    }

    res.json({ role: user.role || "member" }); // default fallback
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
module.exports = { registerUser, getUserRole };
