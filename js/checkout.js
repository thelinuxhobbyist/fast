// Stripe Checkout Integration
// Replace 'pk_test_...' with your actual Stripe Publishable Key when ready

// Initialize Stripe with placeholder key
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');

// Create an instance of Elements
const elements = stripe.elements({
	fonts: [
		{
			cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
		},
	],
});

// Custom styling to match the site design
const style = {
	base: {
		color: '#111',
		fontFamily: 'Inter, system-ui, Arial, sans-serif',
		fontSmoothing: 'antialiased',
		fontSize: '15px',
		'::placeholder': {
			color: '#999',
		},
		lineHeight: '1.45',
	},
	invalid: {
		color: '#dc3545',
		iconColor: '#dc3545',
	},
};

// Create an instance of the card Element
const cardElement = elements.create('card', { style: style });

// Add an instance of the card Element into the `card-element` div
cardElement.mount('#card-element');

// Handle real-time validation errors from the card Element
cardElement.on('change', function(event) {
	const displayError = document.getElementById('card-errors');
	if (event.error) {
		displayError.textContent = event.error.message;
		displayError.classList.add('visible');
	} else {
		displayError.textContent = '';
		displayError.classList.remove('visible');
	}
});

// Handle form submission
const submitButton = document.getElementById('submit-payment');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

submitButton.addEventListener('click', async function(event) {
	event.preventDefault();
	
	// Validate contact information
	const customerName = document.getElementById('customer-name').value.trim();
	const customerEmail = document.getElementById('customer-email').value.trim();
	
	if (!customerName || !customerEmail) {
		alert('Please fill in all required fields.');
		return;
	}
	
	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(customerEmail)) {
		alert('Please enter a valid email address.');
		return;
	}
	
	// Disable button and show loading state
	submitButton.disabled = true;
	buttonText.style.display = 'none';
	spinner.classList.remove('hidden');
	
	// In a real implementation, you would:
	// 1. Create a PaymentIntent on your server
	// 2. Get the client_secret from the response
	// 3. Confirm the payment with Stripe
	
	// For now, we'll simulate the process
	simulatePayment(customerName, customerEmail);
});

// Simulate payment processing (replace with actual Stripe integration)
async function simulatePayment(name, email) {
	try {
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		// In production, you would do:
		// const response = await fetch('/create-payment-intent', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({
		//     name: name,
		//     email: email,
		//     packageId: getSelectedPackageId(),
		//     amount: getOrderTotal(),
		//   }),
		// });
		// const { clientSecret } = await response.json();
		// 
		// const result = await stripe.confirmCardPayment(clientSecret, {
		//   payment_method: {
		//     card: cardElement,
		//     billing_details: {
		//       name: name,
		//       email: email,
		//     },
		//   },
		// });
		// 
		// if (result.error) {
		//   showError(result.error.message);
		// } else {
		//   if (result.paymentIntent.status === 'succeeded') {
		//     window.location.href = 'success.html?payment_intent=' + result.paymentIntent.id;
		//   }
		// }
		
		// For demo purposes, redirect to success page
		console.log('Payment simulation for:', name, email);
		window.location.href = 'success.html';
		
	} catch (error) {
		showError('An error occurred. Please try again.');
		console.error('Payment error:', error);
	}
}

function showError(message) {
	const displayError = document.getElementById('card-errors');
	displayError.textContent = message;
	displayError.classList.add('visible');
	
	// Re-enable button
	submitButton.disabled = false;
	buttonText.style.display = 'flex';
	spinner.classList.add('hidden');
}

// Helper functions for package selection (can be expanded)
function getSelectedPackageId() {
	// In production, get from URL params or session storage
	return 'logo-basic';
}

function getOrderTotal() {
	// Parse from the summary
	const totalText = document.getElementById('summary-total').textContent;
	return parseFloat(totalText.replace('£', '').replace(',', ''));
}

// Optional: Load package details from URL parameters
window.addEventListener('DOMContentLoaded', function() {
	const urlParams = new URLSearchParams(window.location.search);
	const packageId = urlParams.get('package');
	
	if (packageId) {
		loadPackageDetails(packageId);
	}
});

function loadPackageDetails(packageId) {
	// In production, fetch package details from your data source
	// For now, fetch from SERVICES array if available
	if (typeof SERVICES === 'undefined') {
		console.error('SERVICES not loaded');
		return;
	}
	
	const pkg = SERVICES.find(s => s.id === packageId);
	
	if (pkg) {
		document.getElementById('package-name').textContent = pkg.title;
		document.getElementById('package-desc').textContent = pkg.shortDescription || pkg.longDescription || '';
		document.getElementById('package-price').textContent = pkg.price;
		document.getElementById('summary-package-name').textContent = pkg.title;
		document.getElementById('summary-package-price').textContent = pkg.price + '.00';
		document.getElementById('summary-total').textContent = pkg.price + '.00';
	}
}
