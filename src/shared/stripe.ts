import Stripe from "stripe";
import config from "../config";

if (!config.stripe.stripe_secret_key) {
  throw new Error("STRIPE_SECRET_KEY must be provided");
}

const stripe = new Stripe(config.stripe.stripe_secret_key, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export default stripe;
