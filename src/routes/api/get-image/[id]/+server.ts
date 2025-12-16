import { error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }: RequestEvent) => {
	const imageId = params.id;
	
	if (!imageId) {
		return error(400, { message: 'Image ID is required' });
	}

	try {
		const key = `guitar-picks/${imageId}.png`;
		const object = await platform?.env.IMAGES_BUCKET.get(key);

		if (!object) {
			return error(404, { message: 'Image not found' });
		}

		return new Response(object.body, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	} catch (err) {
		console.error('Error retrieving image:', err);
		return error(500, { message: 'Failed to retrieve image' });
	}
};
