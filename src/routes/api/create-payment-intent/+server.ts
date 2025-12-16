import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';
import Stripe from 'stripe';

export const POST: RequestHandler = async ({ request, platform }: RequestEvent) => {
	const data = await request.json() as {
		imageId: string;
		name: string;
		address: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	const { imageId, name, address, city, state, zip, country } = data;
	
	if (!imageId || !name || !address || !city || !state || !zip || !country) {
		return error(400, { message: 'All fields are required' });
	}

	try {
		const stripe = new Stripe(platform?.env.STRIPE_SECRET_KEY || '', {
			apiVersion: '2025-11-17.clover',
		});

		// Create a payment intent for $9.99 (price in cents)
		const paymentIntent = await stripe.paymentIntents.create({
			amount: 999, // $9.99
			currency: 'usd',
			metadata: {
				imageId,
				name,
				address,
				city,
				state,
				zip,
				country
			}
		});

		return json({
			clientSecret: paymentIntent.client_secret
		});
	} catch (err) {
		console.error('Error creating payment intent:', err);
		return error(500, { message: 'Failed to create payment intent' });
	}
};
