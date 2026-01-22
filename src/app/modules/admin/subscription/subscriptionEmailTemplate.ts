export const subscriptionEmailTemplate = (planName: string, planPrice: number, features: string[]) => {
    const featuresHtml = features.map(feature => `<li style="margin-bottom: 10px;">${feature}</li>`).join("");

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px; color: #333;">
      <div style="max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background-color: #2D3E50; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Subscription Success!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <h2 style="color: #2D3E50; font-size: 20px;">Hello,</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            Thank you for choosing <strong>Together</strong>! Your subscription to the <strong>${planName}</strong> has been successfully processed.
          </p>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 25px; margin: 30px 0;">
            <h3 style="margin-top: 0; color: #2D3E50; font-size: 18px; border-bottom: 2px solid #eef2f3; padding-bottom: 15px;">Plan Details</h3>
            <p style="font-size: 15px; margin: 15px 0;"><strong>Plan:</strong> ${planName}</p>
  
            
            <h4 style="margin-bottom: 15px; color: #2D3E50; font-size: 16px;">Key Benefits:</h4>
            <ul style="padding-left: 20px; font-size: 15px; color: #555;">
              ${featuresHtml}
            </ul>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555;">
            You can now enjoy all the exclusive features included in your plan. Start connecting and exploring today!
          </p>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://togetherapp.ai" style="background-color: #E21D48; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Explore Together</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px; text-align: center; border-top: 1px solid #eef2f3;">
          <p style="font-size: 13px; color: #999; margin: 0;">&copy; ${new Date().getFullYear()} Together. All rights reserved.</p>
          <p style="font-size: 13px; color: #999; margin: 5px 0 0;">Need help? Contact our support team.</p>
        </div>
      </div>
    </div>
  `;
};
