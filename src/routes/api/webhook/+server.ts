import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform }: RequestEvent) => {
	const signature = request.headers.get('stripe-signature');
	
	if (!signature) {
		return error(400, { message: 'Missing stripe-signature header' });
	}

	try {
		const stripe = new Stripe(platform?.env.STRIPE_SECRET_KEY || '', {
			apiVersion: '2025-11-17.clover',
		});

		const body = await request.text();
		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			platform?.env.STRIPE_WEBHOOK_SECRET || ''
		);

		// Handle the event
		switch (event.type) {
			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				
				// Store order in KV
				const orderId = crypto.randomUUID();
				const orderData = {
					orderId,
					paymentIntentId: paymentIntent.id,
					imageId: paymentIntent.metadata.imageId,
					name: paymentIntent.metadata.name,
					address: paymentIntent.metadata.address,
					city: paymentIntent.metadata.city,
					state: paymentIntent.metadata.state,
					zip: paymentIntent.metadata.zip,
					country: paymentIntent.metadata.country,
					status: 'paid',
					createdAt: new Date().toISOString()
				};

				await platform?.env.ORDERS_KV.put(
					orderId,
					JSON.stringify(orderData)
				);

				console.log('Order created:', orderId);
				break;
			}
			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				console.log('Payment failed:', paymentIntent.id);
				break;
			}
			default:
				console.log(`Unhandled event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (err) {
		console.error('Webhook error:', err);
		return error(400, { message: 'Webhook error' });
	}
};
