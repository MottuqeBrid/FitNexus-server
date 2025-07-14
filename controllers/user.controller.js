const { getDB } = require("../db/connect");

const registerUser = async (req, res) => {
  try {
    const { uid, name, email, photoURL, role, createdAt, lastLogin } = req.body;

    const db = getDB();
    const userExists = await db.collection("users").findOne({ email });

    if (userExists) {
      await db
        .collection("users")
        .findOneAndUpdate({ email }, { $set: { lastLogin: new Date() } });
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

const updateLogin = async (req, res) => {
  const email = req.body.email;
  const db = getDB();

  try {
    const result = await db
      .collection("users")
      .findOneAndUpdate({ email }, { $set: { lastLogin: new Date() } });

    if (!result.value) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User login updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get user profile by email
const getUserProfile = async (req, res) => {
  try {
    const email = req.params.email;
    const db = getDB();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
        // Return basic structure for new users
        email,
        displayName: "",
        photoURL: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        bio: "",
        height: "",
        weight: "",
        fitnessGoals: "",
        emergencyContact: "",
        medicalConditions: "",
        preferredWorkoutTime: "",
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const email = req.params.email;
    const updateData = {
      ...req.body,
      email, // Ensure email stays the same
      updatedAt: new Date(),
    };

    const db = getDB();

    // Check if user exists
    const existingUser = await db.collection("users").findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        message: "User profile not found",
        status: false,
      });
    }
    // Update existing profile
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { email },
        { $set: updateData },
        { returnDocument: "after" }
      );

    res.json({
      message: "Profile updated successfully",
      data: result.value,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

module.exports = {
  registerUser,
  getUserRole,
  updateLogin,
  getUserProfile,
  updateUserProfile,
};
