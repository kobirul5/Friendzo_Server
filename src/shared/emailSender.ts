import nodemailer from "nodemailer";
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: "premium51.web-hosting.com",
    port: 587,
    secure: false,
    auth: {
      user: "noreply@togetherapp.ai",
      pass: "i5{f)+JjW^GHnf{o%A",
    },
  });

  const info = await transporter.sendMail({
    from: "Togetherapp Team <" + config.emailSender.email + ">",
    to: email,
    subject: subject,
    html,
  });
};

export default emailSender;
