# Custom Guitar Pick Creator

A Cloudflare Workers site that generates AI art and prints it on custom guitar picks, which are then mailed to customers. This application combines image generation AI, payment processing, and e-commerce fulfillment.

## Features

- 🎨 **AI Image Generation**: Generate custom images from text prompts using Cloudflare Workers AI
- 🎸 **Guitar Pick Preview**: See your design superimposed on a guitar pick before purchasing
- 💳 **Stripe Payment Integration**: Secure payment processing with Stripe
- 📦 **Order Management**: Automatic order storage and tracking
- 🌍 **Global Delivery**: Collect shipping information for worldwide delivery

## Technology Stack

- **Frontend**: [SvelteKit](https://kit.svelte.dev/) - Modern web framework
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com) - Global edge hosting
- **AI**: [Workers AI](https://developers.cloudflare.com/workers-ai/) - Stable Diffusion XL for image generation
- **Storage**: [R2](https://developers.cloudflare.com/r2/) - Object storage for images
- **Database**: [KV](https://developers.cloudflare.com/kv/) - Key-value store for order tracking
- **Payments**: [Stripe](https://stripe.com) - Payment processing

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- A Cloudflare account
- A Stripe account

### Installation

1. Clone the repository
```bash
git clone https://github.com/modster/floor-is-llava.git
cd floor-is-llava
```

2. Install dependencies
```bash
npm install
```

3. Set up Cloudflare resources (R2 bucket, KV namespace) - See [SETUP.md](./SETUP.md) for detailed instructions

4. Configure Stripe keys in `wrangler.toml` and set secrets:
```bash
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

5. Deploy to Cloudflare Pages
```bash
npm run deploy
```

## Configuration

See [SETUP.md](./SETUP.md) for complete setup instructions including:
- Creating Cloudflare resources (R2, KV)
- Configuring Stripe integration
- Setting environment variables and secrets
- Webhook configuration

## Development

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Run type checking:
```bash
npm run check
```

Run linting:
```bash
npm run lint
```

## How It Works

1. **User enters a prompt**: Customer describes the image they want (e.g., "a purple dragon with flames")
2. **AI generates image**: Cloudflare Workers AI (Stable Diffusion XL) creates the image
3. **Preview on guitar pick**: Image is composited onto a guitar pick template
4. **Collect shipping info**: Customer enters their mailing address
5. **Process payment**: Stripe handles the secure payment ($9.99)
6. **Store order**: Order details and image are stored for fulfillment
7. **Ship product**: Guitar pick is manufactured and shipped to the customer

## API Endpoints

- `POST /api/generate-image` - Generate an image from text prompt
- `POST /api/create-guitar-pick` - Composite image onto guitar pick and store in R2
- `GET /api/get-image/[id]` - Retrieve stored guitar pick image
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `POST /api/webhook` - Handle Stripe webhook events

## Project Structure

```
floor-is-llava/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          # Main UI
│   │   └── api/
│   │       ├── generate-image/   # Image generation endpoint
│   │       ├── create-guitar-pick/ # Guitar pick creation
│   │       ├── get-image/        # Image retrieval
│   │       ├── create-payment-intent/ # Payment initialization
│   │       └── webhook/          # Stripe webhook handler
│   ├── app.d.ts                  # TypeScript definitions
│   └── app.html                  # HTML template
├── static/
│   └── guitar-pick-template.svg  # Guitar pick SVG template
├── wrangler.toml                 # Cloudflare configuration
├── SETUP.md                      # Detailed setup guide
└── package.json                  # Dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with 🧡 on [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- Original concept inspired by the Llava vision model demo
- Powered by [Stripe](https://stripe.com) for secure payments

## Support

For questions or issues:
- Check the [SETUP.md](./SETUP.md) for configuration help
- Review [Cloudflare Workers AI docs](https://developers.cloudflare.com/workers-ai/)
- Consult [Stripe documentation](https://stripe.com/docs)
- Open an issue on GitHub

