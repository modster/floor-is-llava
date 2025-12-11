# Custom Guitar Pick Creator - Setup Guide

This application allows users to generate AI art and get it printed on a guitar pick, which is then mailed to them. Payment processing is handled through Stripe.

## Prerequisites

Before deploying this application, you'll need:

1. A Cloudflare account with:
   - Workers AI enabled
   - R2 storage access
   - KV namespace access
   - Pages deployment capability

2. A Stripe account for payment processing

## Setup Instructions

### 1. Create Cloudflare Resources

#### Create an R2 Bucket
```bash
wrangler r2 bucket create guitar-pick-images
```

#### Create a KV Namespace
```bash
# For production
wrangler kv:namespace create ORDERS_KV

# For preview/development
wrangler kv:namespace create ORDERS_KV --preview
```

**IMPORTANT**: After creating the KV namespace, you MUST update the `id` in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ORDERS_KV"
id = "your-kv-namespace-id-here"  # Replace this with the actual ID from the command output
```

The application will not deploy without a valid KV namespace ID.

### 2. Configure Stripe

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from the Developers section
3. Set up the Stripe webhook for order processing

#### Set Stripe Secrets

Set your Stripe secret keys using Wrangler:

```bash
# Set the Stripe secret key
wrangler secret put STRIPE_SECRET_KEY
# When prompted, paste your Stripe secret key (sk_test_... or sk_live_...)

# Set the Stripe webhook secret
wrangler secret put STRIPE_WEBHOOK_SECRET
# When prompted, paste your webhook secret from Stripe Dashboard
```

#### Update the Stripe Publishable Key

In `wrangler.toml`, update the `STRIPE_PUBLISHABLE_KEY`:

```toml
[vars]
STRIPE_PUBLISHABLE_KEY = "pk_test_your_actual_key_here"
```

Also update the Stripe publishable key in `src/routes/+page.svelte` (line 33):

```typescript
stripe = (window as any).Stripe('pk_test_your_actual_key_here');
```

#### Configure Stripe Webhook

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.pages.dev/api/webhook`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and use it for `STRIPE_WEBHOOK_SECRET`

### 3. Install Dependencies

```bash
npm install
```

### 4. Deploy to Cloudflare Pages

```bash
npm run deploy
```

Or connect your repository to Cloudflare Pages:

1. Go to https://dash.cloudflare.com > Workers & Pages > Create
2. Click "Connect to Git"
3. Select your repository
4. Set the build settings:
   - Framework preset: SvelteKit
   - Build command: `npm run build`
   - Build output directory: `.svelte-kit/cloudflare`

## Application Flow

1. **Image Generation**: User enters a text prompt describing the image they want
2. **Guitar Pick Preview**: AI generates the image and composites it onto a guitar pick template
3. **Shipping Information**: User enters their mailing address
4. **Payment**: User pays $9.99 via Stripe
5. **Order Processing**: Payment webhook triggers order storage in KV
6. **Fulfillment**: Order details are stored for manual fulfillment

## API Endpoints

- `POST /api/generate-image` - Generate an image from a text prompt
- `POST /api/create-guitar-pick` - Store the guitar pick image in R2
- `GET /api/get-image/[id]` - Retrieve a stored image
- `POST /api/create-payment-intent` - Create a Stripe payment intent
- `POST /api/webhook` - Handle Stripe webhook events

## Environment Variables and Secrets

### Public Variables (in wrangler.toml)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (pk_test_... or pk_live_...)

### Secrets (set via wrangler secret put)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_test_... or sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (whsec_...)

## Local Development

To run locally with Wrangler:

```bash
npm run dev
```

Note: Local development requires setting up local bindings for R2 and KV in your wrangler.toml or using remote bindings.

## Order Fulfillment

After payment is successful, order details are stored in the KV namespace with the following structure:

```json
{
  "orderId": "uuid",
  "paymentIntentId": "pi_xxx",
  "imageId": "uuid",
  "name": "Customer Name",
  "address": "Street Address",
  "city": "City",
  "state": "State",
  "zip": "12345",
  "country": "United States",
  "status": "paid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

You'll need to implement a separate system to:
1. Fetch paid orders from KV
2. Retrieve the guitar pick images from R2
3. Send to a print-on-demand service
4. Ship to customers

## Production Checklist

- [ ] Update Stripe keys to live mode (pk_live_... and sk_live_...)
- [ ] Configure production webhook endpoint in Stripe
- [ ] Set up order fulfillment process
- [ ] Test the complete flow end-to-end
- [ ] Set up monitoring and error alerting
- [ ] Configure custom domain (optional)
- [ ] Add terms of service and privacy policy pages
- [ ] Test with various prompts to ensure appropriate content

## Pricing

Current price is set to $9.99 USD. To change the price, update:

1. `src/routes/api/create-payment-intent/+server.ts` - Line 25: `amount: 999` (in cents)
2. `src/routes/+page.svelte` - All display references to "$9.99"

## Support

For issues with:
- Cloudflare services: https://developers.cloudflare.com/
- Stripe integration: https://stripe.com/docs
- SvelteKit: https://kit.svelte.dev/docs
