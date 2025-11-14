// Cloudflare Pages Function to create a Stripe Payment Intent
export async function onRequestPost(context) {
	const { request, env } = context;
	
	try {
		const { amount, currency = 'gbp', customerEmail, customerName } = await request.json();
		
		// Validate the request
		if (!amount || amount < 50) {
			return new Response(JSON.stringify({ error: 'Invalid amount' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		// Create Payment Intent with Stripe
		const response = await fetch('https://api.stripe.com/v1/payment_intents', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				amount: amount.toString(),
				currency: currency,
				'automatic_payment_methods[enabled]': 'true',
				'receipt_email': customerEmail || '',
				'description': `Payment from ${customerName || 'Customer'}`
			})
		});
		
		const paymentIntent = await response.json();
		
		if (!response.ok) {
			throw new Error(paymentIntent.error?.message || 'Payment intent creation failed');
		}
		
		return new Response(JSON.stringify({
			clientSecret: paymentIntent.client_secret
		}), {
			status: 200,
			headers: { 
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			}
		});
		
	} catch (error) {
		return new Response(JSON.stringify({ 
			error: error.message || 'Internal server error' 
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

// Handle CORS preflight
export async function onRequestOptions() {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
}
