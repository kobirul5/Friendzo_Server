import nodemailer from "nodemailer";

const emailSender = async (email: string, html: string, subject: string) => {
  // ক্লায়েন্ট প্রদত্ত সঠিক হোস্টেড ডোমেইন ব্যবহার করা হলো
  const host = "togetherapp.ai";

  const transporter = nodemailer.createTransport({
    host: host,
    port: 465, // SSL/TLS পোর্ট
    secure: true, // Port 465 এর জন্য অবশ্যই true দিতে হবে
    auth: {
      user: "noreply@togetherapp.ai",
      // আপনার পাসওয়ার্ড কনফিগ বা এনভায়রনমেন্ট ভেরিয়েবল থেকে নিন
      pass: "i5{f)+JjW^GHnf{o%A",
    },
    // যদি SSL/TLS এরর আসে, তবে এটি যোগ করতে পারেন (তবে এটি রেকমেন্ডেড নয়)
    // tls: {
    //   rejectUnauthorized: false
    // }
  });

  // প্রথমে কানেকশনটা ভেরিফাই করা খুব জরুরি
  transporter.verify(function (error, success) {
    if (error) {
      console.error("SMTP Configuration Error:", error);
    } else {
      console.log("SMTP Server is ready to take messages.");
    }
  });
  const info = await transporter.sendMail({
    from: "noreply@togetherapp.ai",
    to: email,
    subject: subject,
    html,
  });
  console.log("Message sent: %s", info.messageId);
};

export default emailSender;
// import nodemailer from "nodemailer";
// import config from "../config";

// const emailSender = async (email: string, html: string, subject: string) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       // user: "sahin.backend@gmail.com",
//       // pass: "jgac trhv xkxa esaw",
//       user: config.emailSender.email, // Use the email from config
//       pass: config.emailSender.app_pass, // Use the app password from config
//     },
//   });

//   const info = await transporter.sendMail({
//     from: "mgdton100@gmail.com",
//     to: email,
//     subject: subject,
//     html,
//   });

// };

// export default emailSender;
