import { NextResponse } from "next/server";
// import Stripe from "stripe"; // Uncomment when Stripe is installed: npm install stripe
// import { createClient } from "@supabase/supabase-js"; // Uncomment when Stripe integration is active

// Initialize Stripe with future key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
//   apiVersion: "2024-11-20.acacia",
// });

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

export async function POST() {
  // Check if Stripe is enabled
  if (process.env.STRIPE_ENABLED !== "true") {
    console.log(
      "Stripe webhook received - Stripe integration disabled (STRIPE_ENABLED=false)",
    );
    return NextResponse.json({
      received: true,
      message: "Stripe integration disabled",
    });
  }

  // TODO: Uncomment Stripe integration when ready
  console.log("Stripe webhook received - Stripe integration not yet active");

  try {
    // TODO: When Stripe is activated, add request parameter back:
    // export async function POST(request: Request) {
    //   const body = await request.text();
    //   const signature = (await headers()).get("stripe-signature");
    //   // ... rest of Stripe logic

    // TODO: Uncomment when Stripe is configured
    // if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    // }

    // TODO: Uncomment when Stripe is installed
    // const event = stripe.webhooks.constructEvent(
    //   body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // );

    // TODO: Replace with actual event handling when Stripe is ready
    // switch (event.type) {
    //   case "customer.subscription.created":
    //   case "customer.subscription.updated":
    //   case "customer.subscription.deleted":
    //     await handleSubscriptionChange(event);
    //     break;
    //   case "invoice.paid":
    //     await handleInvoicePaid(event);
    //     break;
    //   case "invoice.payment_failed":
    //     await handlePaymentFailed(event);
    //     break;
    //   default:
    //     console.log(`Unhandled event type: ${event.type}`);
    // }

    return NextResponse.json({
      received: true,
      message: "Stripe integration template - not active",
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

// TODO: Uncomment these functions when Stripe is installed
/**
 * Handle subscription lifecycle changes
 * Updates org_subscriptions with Stripe data
 */
// async function handleSubscriptionChange(event: Stripe.Event) {
//   const subscription = event.data.object as Stripe.Subscription;

//   // Find org by Stripe customer ID
//   const { data: orgSubs } = await supabase
//     .from("org_subscriptions")
//     .select("org_id")
//     .eq("stripe_customer_id", subscription.customer as string)
//     .single();

//   if (!orgSubs) {
//     console.error(`No org found for Stripe customer: ${subscription.customer}`);
//     return;
//   }

//   // Map Stripe status to our status
//   const statusMap = {
//     active: "active",
//     trialing: "trialing",
//     past_due: "past_due",
//     canceled: "canceled",
//     incomplete: "active",
//     incomplete_expired: "canceled",
//     unpaid: "past_due",
//   };

//   // Update subscription with Stripe data
//   await supabase
//     .from("org_subscriptions")
//     .update({
//       stripe_subscription_id: subscription.id,
//       stripe_price_id: subscription.items.data[0]?.price.id,
//       status:
//         statusMap[subscription.status as keyof typeof statusMap] || "active",
//       current_period_start: new Date(subscription.current_period_start * 1000)
//         .toISOString()
//         .split("T")[0],
//       current_period_end: new Date(subscription.current_period_end * 1000)
//         .toISOString()
//         .split("T")[0],
//       cancel_at_period_end: subscription.cancel_at_period_end,
//       updated_at: new Date().toISOString(),
//     })
//     .eq("org_id", orgSubs.org_id);

//   console.log(`Updated subscription for org ${orgSubs.org_id}: ${event.type}`);
// }

/**
 * Handle successful payment
 * Confirms provisioning and can trigger activation
 */
// async function handleInvoicePaid(event: Stripe.Event) {
//   const invoice = event.data.object as Stripe.Invoice;

//   if (!invoice.subscription) return;

//   // Find org subscription
//   const { data: orgSubs } = await supabase
//     .from("org_subscriptions")
//     .select("org_id")
//     .eq("stripe_subscription_id", invoice.subscription as string)
//     .single();

//   if (!orgSubs) return;

//   // Ensure subscription is active (in case it was past_due)
//   await supabase
//     .from("org_subscriptions")
//     .update({
//       status: "active",
//       updated_at: new Date().toISOString(),
//     })
//     .eq("org_id", orgSubs.org_id);

//   console.log(`Payment confirmed for org ${orgSubs.org_id}: ${invoice.id}`);
// }

/**
 * Handle payment failure
 * Sets status to past_due and can trigger limits/degradation
 */
// async function handlePaymentFailed(event: Stripe.Event) {
//   const invoice = event.data.object as Stripe.Invoice;

//   if (!invoice.subscription) return;

//   // Find org subscription
//   const { data: orgSubs } = await supabase
//     .from("org_subscriptions")
//     .select("org_id")
//     .eq("stripe_subscription_id", invoice.subscription as string)
//     .single();

//   if (!orgSubs) return;

//   // Set to past_due - this will trigger enforcement limits
//   await supabase
//     .from("org_subscriptions")
//     .update({
//       status: "past_due",
//       updated_at: new Date().toISOString(),
//     })
//     .eq("org_id", orgSubs.org_id);

//   console.log(`Payment failed for org ${orgSubs.org_id}: ${invoice.id}`);

//   // TODO: Send notification email about payment failure
//   // TODO: Consider grace period before strict limits
// }
