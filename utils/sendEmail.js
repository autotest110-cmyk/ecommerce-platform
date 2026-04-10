const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    // 🔍 Debug logs (remove later)
    console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);
    console.log(
      "📧 EMAIL_PASS:",
      process.env.EMAIL_PASS ? "EXISTS" : "MISSING"
    );

    // ✅ Production-safe transporter (better than service: gmail)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // ✅ Send email
    const info = await transporter.sendMail({
      from: `"AutoTest OTP" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return true;

  } catch (error) {
    console.error("❌ Email send failed:", error.message);

    // ⚠️ Do NOT crash server
    return false;
  }
};

module.exports = sendEmail;
