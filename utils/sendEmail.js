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

    console.log("📧 Sending OTP email...");
    console.log("📧 From:", process.env.EMAIL_USER);
    console.log("📧 To:", to);

    await transporter.verify();
    console.log("✅ SMTP connection verified");

    const info = await transporter.sendMail({
      from: `"AutoTest OTP" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    console.log("📧 Accepted:", info.accepted);
    console.log("📧 Rejected:", info.rejected);

    return true;

  } catch (error) {
    console.error("❌ EMAIL ERROR:");
    console.error(error);
    throw error;
  }
};

module.exports = sendEmail;