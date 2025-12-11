<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	
	export let data: PageData;
	
	// State variables
	let prompt: string = '';
	let generatedImage: string | null = null;
	let guitarPickPreview: string | null = null;
	let imageId: string | null = null;
	let isGenerating: boolean = false;
	let isProcessingPayment: boolean = false;
	let step: 'generate' | 'preview' | 'checkout' | 'complete' = 'generate';
	
	// Shipping information
	let name: string = '';
	let address: string = '';
	let city: string = '';
	let state: string = '';
	let zip: string = '';
	let country: string = 'United States';
	
	// Stripe
	let stripe: any = null;
	let elements: any = null;
	let cardElement: any = null;
	let clientSecret: string | null = null;

	onMount(async () => {
		// Load Stripe
		if (typeof window !== 'undefined') {
			const script = document.createElement('script');
			script.src = 'https://js.stripe.com/v3/';
			script.onload = () => {
				stripe = (window as any).Stripe(data.stripePublishableKey);
			};
			document.head.appendChild(script);
		}
	});

	const generateImage = async () => {
		if (!prompt) {
			alert('Please enter a prompt for the image.');
			return;
		}

		isGenerating = true;
		try {
			const response = await fetch('/api/generate-image', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ prompt })
			});

			if (!response.ok) {
				throw new Error('Failed to generate image');
			}

			const blob = await response.blob();
			generatedImage = URL.createObjectURL(blob);
			
			// Create guitar pick preview
			await createGuitarPickPreview(blob);
			
			step = 'preview';
		} catch (error) {
			console.error('Error generating image:', error);
			alert('Failed to generate image. Please try again.');
		} finally {
			isGenerating = false;
		}
	};

	const createGuitarPickPreview = async (imageBlob: Blob) => {
		// Create a canvas to composite the image onto the guitar pick
		const canvas = document.createElement('canvas');
		canvas.width = 300;
		canvas.height = 350;
		const ctx = canvas.getContext('2d');

		if (!ctx) return;

		// Draw white background
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, 300, 350);

		// Create guitar pick shape path
		ctx.beginPath();
		ctx.moveTo(150, 10);
		ctx.bezierCurveTo(80, 10, 30, 60, 30, 130);
		ctx.bezierCurveTo(30, 200, 80, 250, 150, 340);
		ctx.bezierCurveTo(220, 250, 270, 200, 270, 130);
		ctx.bezierCurveTo(270, 60, 220, 10, 150, 10);
		ctx.closePath();

		// Clip to pick shape
		ctx.save();
		ctx.clip();

		// Load and draw the generated image
		const img = new Image();
		img.src = URL.createObjectURL(imageBlob);
		await new Promise((resolve) => {
			img.onload = resolve;
		});

		// Draw image centered and scaled to fit
		const size = 160;
		ctx.drawImage(img, 150 - size/2, 120 - size/2, size, size);

		ctx.restore();

		// Draw pick outline
		ctx.strokeStyle = '#333';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(150, 10);
		ctx.bezierCurveTo(80, 10, 30, 60, 30, 130);
		ctx.bezierCurveTo(30, 200, 80, 250, 150, 340);
		ctx.bezierCurveTo(220, 250, 270, 200, 270, 130);
		ctx.bezierCurveTo(270, 60, 220, 10, 150, 10);
		ctx.closePath();
		ctx.stroke();

		// Convert to blob and upload to server
		canvas.toBlob(async (blob) => {
			if (!blob) return;
			
			guitarPickPreview = canvas.toDataURL();

			// Upload to server
			const formData = new FormData();
			formData.append('image', blob, 'guitar-pick.png');

			try {
				const response = await fetch('/api/create-guitar-pick', {
					method: 'POST',
					body: formData
				});

				const result = await response.json() as { imageId: string };
				imageId = result.imageId;
			} catch (error) {
				console.error('Error uploading guitar pick:', error);
			}
		}, 'image/png');
	};

	const proceedToCheckout = async () => {
		if (!name || !address || !city || !state || !zip || !country) {
			alert('Please fill in all shipping information.');
			return;
		}

		if (!imageId) {
			alert('Please generate an image first.');
			return;
		}

		try {
			// Create payment intent
			const response = await fetch('/api/create-payment-intent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					imageId,
					name,
					address,
					city,
					state,
					zip,
					country
				})
			});

			const data = await response.json() as { clientSecret: string };
			clientSecret = data.clientSecret;

			// Initialize Stripe elements
			if (stripe && clientSecret) {
				elements = stripe.elements({ clientSecret });
				cardElement = elements.create('payment');
				cardElement.mount('#card-element');
			}

			step = 'checkout';
		} catch (error) {
			console.error('Error creating payment intent:', error);
			alert('Failed to initialize checkout. Please try again.');
		}
	};

	const handlePayment = async () => {
		if (!stripe || !elements) {
			return;
		}

		isProcessingPayment = true;

		try {
			const { error } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: window.location.origin + '/success',
				},
				redirect: 'if_required'
			});

			if (error) {
				alert(error.message);
			} else {
				step = 'complete';
			}
		} catch (error) {
			console.error('Payment error:', error);
			alert('Payment failed. Please try again.');
		} finally {
			isProcessingPayment = false;
		}
	};

	const startOver = () => {
		prompt = '';
		generatedImage = null;
		guitarPickPreview = null;
		imageId = null;
		step = 'generate';
		name = '';
		address = '';
		city = '';
		state = '';
		zip = '';
		country = 'United States';
	};
</script>

<div class="container">
	<h1>Custom Guitar Pick Creator</h1>
	<p class="subtitle">Generate AI art and get it printed on a guitar pick, mailed to you!</p>

	{#if step === 'generate'}
		<div class="step">
			<h2>Step 1: Generate Your Image</h2>
			<div class="prompt-section">
				<textarea
					class="prompt-input"
					placeholder="Describe the image you want on your guitar pick (e.g., 'a purple dragon with flames')"
					bind:value={prompt}
					rows="4"
				></textarea>
				<button class="btn-primary" on:click={generateImage} disabled={isGenerating}>
					{isGenerating ? 'Generating...' : 'Generate Image'}
				</button>
			</div>
		</div>
	{/if}

	{#if step === 'preview'}
		<div class="step">
			<h2>Step 2: Preview Your Guitar Pick</h2>
			<div class="preview-section">
				{#if guitarPickPreview}
					<img src={guitarPickPreview} alt="Guitar pick preview" class="guitar-pick-preview" />
				{/if}
				<div class="preview-actions">
					<button class="btn-secondary" on:click={startOver}>Start Over</button>
				</div>
			</div>

			<div class="shipping-form">
				<h3>Shipping Information</h3>
				<input type="text" placeholder="Full Name" bind:value={name} />
				<input type="text" placeholder="Street Address" bind:value={address} />
				<div class="form-row">
					<input type="text" placeholder="City" bind:value={city} />
					<input type="text" placeholder="State/Province" bind:value={state} />
				</div>
				<div class="form-row">
					<input type="text" placeholder="ZIP/Postal Code" bind:value={zip} />
					<input type="text" placeholder="Country" bind:value={country} />
				</div>
				<button class="btn-primary" on:click={proceedToCheckout}>
					Proceed to Checkout ($9.99)
				</button>
			</div>
		</div>
	{/if}

	{#if step === 'checkout'}
		<div class="step">
			<h2>Step 3: Payment</h2>
			<div class="checkout-section">
				<div class="order-summary">
					<h3>Order Summary</h3>
					<p>Custom Guitar Pick: $9.99</p>
					<p>Shipping: Free</p>
					<p class="total">Total: $9.99</p>
				</div>
				
				<div class="payment-form">
					<div id="card-element"></div>
					<button class="btn-primary" on:click={handlePayment} disabled={isProcessingPayment}>
						{isProcessingPayment ? 'Processing...' : 'Pay $9.99'}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if step === 'complete'}
		<div class="step">
			<h2>Order Complete!</h2>
			<div class="success-message">
				<p>✓ Your payment was successful!</p>
				<p>Your custom guitar pick will be mailed to:</p>
				<address>
					{name}<br />
					{address}<br />
					{city}, {state} {zip}<br />
					{country}
				</address>
				<p>You should receive it within 7-10 business days.</p>
				<button class="btn-primary" on:click={startOver}>Create Another</button>
			</div>
		</div>
	{/if}

	<div class="footer">
		<p>
			Built with 🧡 on <a href="https://developers.cloudflare.com/workers-ai/" target="_blank"
				>Workers AI</a
			>
		</p>
		<p>Powered by Stripe for secure payments</p>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	h1 {
		color: #0070f3;
		text-align: center;
		margin-bottom: 10px;
	}

	.subtitle {
		text-align: center;
		color: #666;
		font-size: 18px;
		margin-bottom: 40px;
	}

	.step {
		background: white;
		border-radius: 8px;
		padding: 30px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		margin-bottom: 30px;
	}

	h2 {
		color: #333;
		margin-bottom: 20px;
	}

	h3 {
		color: #333;
		margin-bottom: 15px;
	}

	.prompt-section {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.prompt-input {
		width: 100%;
		padding: 15px;
		font-size: 16px;
		border: 2px solid #ddd;
		border-radius: 5px;
		resize: vertical;
		font-family: inherit;
	}

	.prompt-input:focus {
		outline: none;
		border-color: #0070f3;
	}

	.btn-primary {
		padding: 15px 30px;
		background-color: #0070f3;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 18px;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #005bb5;
	}

	.btn-primary:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 10px 20px;
		background-color: #666;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.2s;
	}

	.btn-secondary:hover {
		background-color: #444;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		margin-bottom: 30px;
	}

	.guitar-pick-preview {
		max-width: 300px;
		border-radius: 10px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.preview-actions {
		display: flex;
		gap: 15px;
	}

	.shipping-form {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.shipping-form input {
		padding: 12px;
		font-size: 16px;
		border: 2px solid #ddd;
		border-radius: 5px;
	}

	.shipping-form input:focus {
		outline: none;
		border-color: #0070f3;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;
	}

	.checkout-section {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.order-summary {
		background: #f5f5f5;
		padding: 20px;
		border-radius: 5px;
	}

	.order-summary p {
		margin: 10px 0;
		font-size: 16px;
	}

	.order-summary .total {
		font-size: 20px;
		font-weight: bold;
		color: #0070f3;
		border-top: 2px solid #ddd;
		padding-top: 10px;
		margin-top: 10px;
	}

	.payment-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	#card-element {
		padding: 15px;
		border: 2px solid #ddd;
		border-radius: 5px;
	}

	.success-message {
		text-align: center;
		padding: 20px;
	}

	.success-message p {
		font-size: 18px;
		margin: 15px 0;
	}

	.success-message address {
		font-style: normal;
		background: #f5f5f5;
		padding: 15px;
		border-radius: 5px;
		margin: 20px 0;
	}

	.footer {
		margin-top: 60px;
		text-align: center;
		font-size: 14px;
		color: #666;
	}

	.footer p {
		margin: 10px 0;
	}

	.footer a {
		color: #0070f3;
		text-decoration: none;
	}

	.footer a:hover {
		text-decoration: underline;
	}
</style>
