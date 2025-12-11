// Collapsible order summary for mobile
document.addEventListener('DOMContentLoaded', function() {
	var toggle = document.querySelector('.summary-toggle');
	var content = document.querySelector('.collapsible-content');
	if (toggle && content) {
		toggle.addEventListener('click', function() {
			var expanded = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', !expanded);
			content.style.display = expanded ? 'none' : 'block';
		});
	}
});
// Stripe Checkout Integration
// Replace 'pk_test_...' with your actual Stripe Publishable Key when ready

// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_51STTem2KkObKPVCjWYundub4WiyxnWFMZZvulyXPNQSrpe8LfO89doMDHZXy6bg02BAOZyGDllziDTGVFcnhEYkU00QCdNmDJ3');

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
const submitButtonMobile = document.getElementById('submit-payment-mobile');
const buttonText = document.getElementById('button-text');
const buttonTextMobile = document.getElementById('button-text-mobile');
const spinner = document.getElementById('spinner');
const spinnerMobile = document.getElementById('spinner-mobile');

// Track selected package id so metadata is accurate when creating PaymentIntent
var SELECTED_PACKAGE_ID = getSelectedPackageId();

// Function to attach click handler to both buttons
function attachPaymentHandler(btn, btnText, spin) {
	if (btn) {
		btn.addEventListener('click', async function(event) {
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
			btn.disabled = true;
			btnText.style.display = 'none';
			spin.classList.remove('hidden');
			
			// Process payment with Stripe
			processPayment(customerName, customerEmail, btn, btnText, spin);
		});
	}
}

attachPaymentHandler(submitButton, buttonText, spinner);
attachPaymentHandler(submitButtonMobile, buttonTextMobile, spinnerMobile);

// Process payment with Stripe
async function processPayment(name, email, btn, btnText, spin) {
	try {
		// Get the order amount (convert to cents/pence)
		const totalAmount = Math.round(getOrderTotal() * 100);
		
		// Create Payment Intent on server
		const response = await fetch('/api/create-payment-intent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				amount: totalAmount,
				currency: 'gbp',
				customerEmail: email,
				customerName: name,
				package_id: SELECTED_PACKAGE_ID || getSelectedPackageId(),
				order_type: 'checkout'
			}),
		});
		
		const data = await response.json();
		
		if (data.error) {
			showError(data.error, btn, btnText, spin);
			return;
		}
		
		const { clientSecret } = data;
		
		// Confirm the payment with Stripe
		const result = await stripe.confirmCardPayment(clientSecret, {
			payment_method: {
				card: cardElement,
				billing_details: {
					name: name,
					email: email,
				},
			},
		});
		
		if (result.error) {
			showError(result.error.message, btn, btnText, spin);
		} else {
			if (result.paymentIntent.status === 'succeeded') {
				window.location.href = 'success.html?payment_intent=' + result.paymentIntent.id;
			}
		}
		
	} catch (error) {
		showError('An error occurred. Please try again.', btn, btnText, spin);
		console.error('Payment error:', error);
	}
}

function showError(message, btn, btnText, spin) {
	const displayError = document.getElementById('card-errors');
	displayError.textContent = message;
	displayError.classList.add('visible');
	
	// Re-enable button
	btn.disabled = false;
	btnText.style.display = 'flex';
	spin.classList.add('hidden');
}

// Payment Request Button for Apple Pay, Google Pay, etc.
const paymentRequest = stripe.paymentRequest({
  country: 'GB',
  currency: 'gbp',
  total: {
    label: 'Fast Graphic Design',
    amount: Math.round(getOrderTotal() * 100),
  },
  requestPayerName: true,
  requestPayerEmail: true,
});

const prButton = elements.create('paymentRequestButton', {
  paymentRequest: paymentRequest,
  style: {
    paymentRequestButton: {
      type: 'default',
      theme: 'light',
      height: '44px',
    },
  },
});

paymentRequest.canMakePayment().then(function(result) {
  if (result) {
    prButton.mount('#payment-request-button');
    document.getElementById('payment-request-button').style.display = 'block';
  } else {
    document.getElementById('payment-request-button').style.display = 'none';
  }
});

// Helper functions for package selection (can be expanded)
function getSelectedPackageId() {
	// Prefer the runtime-selected package id (set by loadPackageDetails)
	if (typeof SELECTED_PACKAGE_ID !== 'undefined' && SELECTED_PACKAGE_ID) return SELECTED_PACKAGE_ID;
	// Fallback to URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const param = urlParams.get('package');
	if (param) return param;
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
		// remember selected package id for metadata
		SELECTED_PACKAGE_ID = packageId;
		document.getElementById('package-name').textContent = pkg.title;
		document.getElementById('package-desc').textContent = pkg.shortDescription || pkg.longDescription || '';
		document.getElementById('package-price').textContent = pkg.price;
		document.getElementById('summary-package-name').textContent = pkg.title;
		document.getElementById('summary-package-price').textContent = pkg.price + '.00';
		document.getElementById('summary-total').textContent = pkg.price + '.00';
	}
}
