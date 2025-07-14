const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FIREBASE_API_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);
// middleware
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const verifyFireBaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};
module.exports = { verifyFireBaseToken };
