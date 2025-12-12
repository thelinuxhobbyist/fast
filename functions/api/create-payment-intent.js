// Cloudflare Pages Function to create a Stripe Payment Intent
export async function onRequestPost(context) {
	const { request, env } = context;
	
	try {
		const { amount, currency = 'gbp', customerEmail, customerName, package_id, order_type } = await request.json();
		
		// Validate the request (Stripe GBP minimum is 1 pence = 1)
		if (!amount || amount < 1) {
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
			body: new URLSearchParams(Object.assign({
				amount: amount.toString(),
				currency: currency,
				'automatic_payment_methods[enabled]': 'true',
				'receipt_email': customerEmail || '',
				'description': `Payment from ${customerName || 'Customer'}`
			},
			// attach metadata for easier server-side verification and form prefilling
			{
				'metadata[package]': package_id || '',
				'metadata[order_type]': order_type || '',
				'metadata[email]': customerEmail || '',
				'metadata[site]': env.SITE_IDENTIFIER || 'fastgraphicdesign'
			}))
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
