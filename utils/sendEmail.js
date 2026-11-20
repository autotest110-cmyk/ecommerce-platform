
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  await transporter.sendMail({
    from: `"AutoTest Store" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent to:", to);
};

module.exports = sendEmail;
