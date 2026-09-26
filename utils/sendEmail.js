const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      family: 4,
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

    console.log("✅ OTP email sent:", info.messageId);

    return true;

  } catch (error) {
    console.error("❌ OTP email failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;

