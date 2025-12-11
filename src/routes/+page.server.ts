import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	return {
		stripePublishableKey: platform?.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
	};
};
