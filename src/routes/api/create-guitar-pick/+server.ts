import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }: RequestEvent) => {
	const data = await request.formData();
	const imageFile = data.get('image') as File;
	
	if (!imageFile) {
		return error(400, { message: 'Image is required' });
	}

	try {
		const imageBuffer = await imageFile.arrayBuffer();
		
		// In a real implementation, you would:
		// 1. Load a guitar pick template image
		// 2. Resize and position the generated image onto the pick
		// 3. Composite them together using an image library
		// For this implementation, we'll create a simple HTML canvas approach
		// that can be done client-side or with a library like sharp (which doesn't work in Workers)
		
		// Store the image in R2 bucket
		const imageId = crypto.randomUUID();
		const key = `guitar-picks/${imageId}.png`;
		
		await platform?.env.IMAGES_BUCKET.put(key, imageBuffer, {
			httpMetadata: {
				contentType: 'image/png'
			}
		});

		return json({
			success: true,
			imageId: imageId,
			imageUrl: `/api/get-image/${imageId}`
		});
	} catch (err) {
		console.error('Error creating guitar pick:', err);
		return error(500, { message: 'Failed to create guitar pick' });
	}
};
