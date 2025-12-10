import nodemailer from "nodemailer";
import config from "../config";

const emailSender = async (email: string, html: string, subject: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      // user: "sahin.backend@gmail.com",
      // pass: "jgac trhv xkxa esaw",
      user: config.emailSender.email, // Use the email from config
      pass: config.emailSender.app_pass, // Use the app password from config
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
