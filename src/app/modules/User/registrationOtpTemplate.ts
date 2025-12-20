export const registrationOtpTemplate = (otp: number) => `
<div style="font-family: Arial, sans-serif; background-color:#f5f7fa; padding:40px;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; padding:30px; border-radius:6px;">
    
    <h2 style="color:#222; text-align:center; margin-bottom:10px;">
      Together App
    </h2>

    <p style="font-size:15px; color:#555; text-align:center;">
      Email Verification Code
    </p>

    <p style="font-size:16px; color:#333; margin-top:30px;">
      Thank you for signing up with <strong>Together App</strong>.
      Please use the following One-Time Password (OTP) to verify your email address:
    </p>

    <div style="text-align:center; margin:30px 0;">
      <span style="font-size:28px; letter-spacing:6px; font-weight:bold; color:#000;">
        ${otp}
      </span>
    </div>

    <p style="font-size:14px; color:#555;">
      This OTP is valid for <strong>5 minutes</strong>.  
      If you did not create an account, you can safely ignore this email.
    </p>

    <hr style="margin:30px 0; border:none; border-top:1px solid #eee;"/>

    <p style="font-size:12px; color:#999; text-align:center;">
      © ${new Date().getFullYear()} Together App. All rights reserved.
    </p>
  </div>
</div>
`;
