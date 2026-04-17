const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"AutoTest OTP" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    // ✅ IMPORTANT CHECK
    if (!info.accepted || info.accepted.length === 0) {
      throw new Error("Email not accepted");
    }

    console.log("✅ Email sent:", info.messageId);

    return true;

  } catch (error) {
    console.error("❌ Email send failed:", error.message);

    // ❌ THROW ERROR (not return false)
    throw new Error("Email delivery failed");
  }
};

module.exports = sendEmail;