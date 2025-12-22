// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				AI: Ai;
				IMAGES_BUCKET: R2Bucket;
				ORDERS_KV: KVNamespace;
				STRIPE_PUBLISHABLE_KEY: string;
				STRIPE_SECRET_KEY: string;
				STRIPE_WEBHOOK_SECRET: string;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
