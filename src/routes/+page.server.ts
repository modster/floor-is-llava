import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	return {
		stripePublishableKey: platform?.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51SgL0WPIX8FoWJzjVv48VHOqsR0KkOhJJLQsRLQ665k12vZfjojboansM7AjBNGDvBlDOI6oZQKZRNZBDqaUoDG200qcryERIY'
	};
};
