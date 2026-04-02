import User from "../models/User.js";

const cleanupUnverifiedUsers = async () => {
  try {
    const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: expiryTime },
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Deleted ${result.deletedCount} unverified users`);
    }
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
};

export default cleanupUnverifiedUsers;
