import { json, error } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }: RequestEvent) => {
	const data = await request.json() as { prompt: string };
	const prompt = data.prompt as string;
	
	if (!prompt) {
		return error(400, { message: 'Prompt is required' });
	}

	try {
		// Use Cloudflare Workers AI to generate an image from text prompt
		// Using Stable Diffusion model
		const response = await platform?.env.AI.run(
			'@cf/stabilityai/stable-diffusion-xl-base-1.0',
			{
				prompt: prompt
			}
		);

		// The response is an image blob
		return new Response(response as unknown as ReadableStream, {
			headers: {
				'Content-Type': 'image/png'
			}
		});
	} catch (err) {
		console.error('Error generating image:', err);
		return error(500, { message: 'Failed to generate image' });
	}
};
