import Stripe from "stripe";
import config from "../config";

if (!config.stripe.stripe_secret_key) {
  console.warn("⚠️ Warning: STRIPE_SECRET_KEY is not set. Stripe functionality will not work until a key is added.");
}

const stripe = new Stripe(config.stripe.stripe_secret_key || "sk_test_placeholder", {
  apiVersion: "2024-06-20",
  typescript: true,
});

export default stripe;
