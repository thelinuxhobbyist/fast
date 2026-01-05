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

// Initialize Stripe with your publishable key and set UK locale so address labels use postcode
const stripe = Stripe('pk_live_51SdUxFKW0ODTEuVznk6fvKbtzMFIiZj8ODDj2RlF7x4gKgaHCPfqp1xnJmVtcMfV18tvEPclcL6ZuSwokAvhxXpF00ONqbhJRT', { locale: 'en-GB' });

// We'll create Elements & the Payment Element dynamically after we receive a client secret
let elements = null;
let paymentElement = null;

// Minimal Element styling (avoid using lineHeight to prevent Stripe warning)
const elementOptions = {
	// appearance and other options can be added here
};

// Handle form submission
let submitButton = null;
let buttonText = null;
let spinner = null;

function getFormElements() {
	if (!submitButton) {
		submitButton = document.getElementById('submit_payment');
		buttonText = document.getElementById('button-text');
		spinner = document.getElementById('spinner');
	}
	return { submitButton, buttonText, spinner };
}

// Track selected package id so metadata is accurate when creating PaymentIntent
// Attempt to load package from URL or sessionStorage EARLY (before DOMContentLoaded)
var SELECTED_PACKAGE_ID = null;

// Try to extract package id from multiple sources
function extractPackageIdEarly() {
	// Try URL param first
	const urlParams = new URLSearchParams(window.location.search);
	const param = urlParams.get('package');
	if (param) {
		console.debug('extractPackageIdEarly: found in URL =', param);
		return param;
	}
	// Try sessionStorage (set by the "Order Your Design Now" click in details page)
	try {
		const stored = sessionStorage.getItem('fast_selected_package');
		if (stored) {
			console.debug('extractPackageIdEarly: found in sessionStorage =', stored);
			try { return decodeURIComponent(stored); } catch (e) { return stored; }
		}
	} catch (e) {}
	// Try referrer
	try {
		if (document.referrer) {
			const refUrl = new URL(document.referrer);
			const p = new URLSearchParams(refUrl.search).get('package');
			if (p) {
				console.debug('extractPackageIdEarly: found in referrer =', p);
				return p;
			}
		}
	} catch (e) {}
	console.debug('extractPackageIdEarly: defaulting to logo-basic');
	return 'logo-basic';
}

// Extract and store immediately
SELECTED_PACKAGE_ID = extractPackageIdEarly();

// Load package details immediately so price is available for retryUpdateSummaries
function loadPackageDetailsImmediate(packageId) {
	if (typeof SERVICES === 'undefined') {
		return; // Will be retried
	}
	const pkg = SERVICES.find(s => s.id === packageId);
	if (pkg) {
		var pn = document.getElementById('package-name'); if (pn) pn.textContent = pkg.title;
		var pd = document.getElementById('package-desc'); if (pd) pd.textContent = pkg.shortDescription || pkg.longDescription || '';
		var pp = document.getElementById('package-price'); if (pp) pp.textContent = pkg.price;
	}
}
loadPackageDetailsImmediate(SELECTED_PACKAGE_ID);

// Function to attach click handler to button

function attachPaymentHandler(btn, btnText, spin) {
	if (btn) {
		btn.addEventListener('click', async function(event) {
			event.preventDefault();
			
			// Validate contact information
			const customerName = document.getElementById('customer_name').value.trim();
			const customerEmail = document.getElementById('customer_email').value.trim();
			
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

// Attach handler when DOM is ready
function initializePaymentForm() {
	const { submitButton: btn, buttonText: btnText, spinner: spin } = getFormElements();
	if (btn) {
		attachPaymentHandler(btn, btnText, spin);
	}
}

// Ensure Payment Element is created and mounted (creates PaymentIntent via server)
async function ensurePaymentElement(name, email) {
	// If already mounted and elements exists, no-op
	if (paymentElement && elements) return true;

	// Create PaymentIntent on server
	const totalAmount = Math.round(getOrderTotal() * 100);
	
	console.log('Creating PaymentIntent with:', {
		amount: totalAmount,
		currency: 'gbp',
		customerEmail: email,
		customerName: name,
		package_id: SELECTED_PACKAGE_ID || getSelectedPackageId()
	});

	try {
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

		if (!response.ok) {
			const errorData = await response.json();
			console.error('API Error Response:', response.status, errorData);
			return { error: errorData.error || `Server error: ${response.status}` };
		}

		const data = await response.json();
		
		if (data.error) {
			console.error('PaymentIntent Error:', data.error);
			return { error: data.error };
		}

		const { clientSecret } = data;
		console.log('PaymentIntent created successfully:', clientSecret.substring(0, 20) + '...');

		// Create Elements with clientSecret and mount Payment Element
		// Configure with UK-specific defaults (no postal code requirement)
		const appearance = {
			theme: 'stripe',
			variables: {
				colorPrimary: '#F58731',
				fontFamily: 'system-ui, -apple-system, sans-serif',
			}
		};
		elements = stripe.elements({ clientSecret, appearance });
		paymentElement = elements.create('payment', {
			// Explicitly allow only card and link payment methods
			// This excludes Klarna, Amazon Pay, Revolut Pay, Apple Pay, Google Pay, etc.
			restrictPaymentMethods: ['card', 'link'],
			fields: {
				billingDetails: 'never'  // Don't collect billing details in Payment Element; we collect them separately
			}
		});
		const mountPoint = document.getElementById('payment_element');
		if (mountPoint) {
			mountPoint.innerHTML = '';
			paymentElement.mount('#payment_element');
			console.log('Payment Element mounted successfully');
			
			// Enable submit button when Payment Element is ready
			const { submitButton } = getFormElements();
			if (submitButton) {
				submitButton.disabled = false;
				console.log('Submit button enabled');
			}
			
			// Listen for Payment Element state changes to enable/disable button
			elements.on('change', function(event) {
				const { submitButton: btn } = getFormElements();
				if (btn) {
					btn.disabled = event.error || !event.complete;
				}
			});
		}

		return { clientSecret };
	} catch (error) {
		console.error('ensurePaymentElement error:', error);
		return { error: error.message || 'Failed to create payment element' };
	}
}

// Process payment with Stripe using the Payment Element
async function processPayment(name, email, btn, btnText, spin) {
	try {
		console.log('processPayment: Starting payment process');
		
		const ensure = await ensurePaymentElement(name, email);
		if (ensure && ensure.error) {
			console.error('Payment Element error:', ensure.error);
			showError(ensure.error, btn, btnText, spin);
			return;
		}

		console.log('Confirming payment with Stripe...');
		
		// Confirm the payment using the Payment Element. redirect:'if_required' keeps handling inline when possible
		// Since we set billingDetails: 'never' in the Payment Element, we must pass billing details in confirmParams
		const confirmResult = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: window.location.origin + '/success.html',
				payment_method_data: {
					billing_details: {
						name: name,
						email: email
					}
				}
			},
			redirect: 'if_required'
		});

		console.log('confirmPayment result:', confirmResult);

		if (confirmResult && confirmResult.error) {
			const errorMsg = confirmResult.error.message || 'Payment failed';
			console.error('Stripe error:', errorMsg, confirmResult.error);
			showError(errorMsg, btn, btnText, spin);
			return;
		}

		if (confirmResult && confirmResult.paymentIntent) {
			console.log('Payment status:', confirmResult.paymentIntent.status);
			
			if (confirmResult.paymentIntent.status === 'succeeded') {
				console.log('Payment succeeded! Redirecting to success page...');
				window.location.href = 'success.html?payment_intent=' + confirmResult.paymentIntent.id;
				return;
			}
		}

		// If the confirm result didn't include a paymentIntent (redirect pending), the browser will redirect automatically.
		console.log('Payment processing - redirect may occur');

	} catch (error) {
		console.error('Payment processing error:', error);
		showError('An error occurred. Please try again.', btn, btnText, spin);
	}
}

function showError(message, btn, btnText, spin) {
	const displayError = document.getElementById('card-errors');
	displayError.textContent = message;
	displayError.classList.add('visible');
	console.error('Payment error displayed to user:', message);
	
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
// Create a separate Elements instance for the Payment Request Button so
// we don't call `.create` on the global `elements` variable which may be
// null until a Payment Element is mounted with a clientSecret.
let prButton = null;
try {
	const prElements = stripe.elements();
	prButton = prElements.create('paymentRequestButton', {
		paymentRequest: paymentRequest,
		style: {
			paymentRequestButton: {
				type: 'default',
				theme: 'light',
				height: '44px',
			},
		},
	});
} catch (e) {
	console.debug('Payment Request Button not available:', e);
}

paymentRequest.canMakePayment().then(function(result) {
	const prContainer = document.getElementById('payment-request-button');
	try {
		if (result && prButton && prContainer) {
			prButton.mount('#payment-request-button');
			prContainer.style.display = 'block';
		} else if (prContainer) {
			prContainer.style.display = 'none';
		}
	} catch (e) {
		console.debug('Error mounting payment request button:', e);
		if (prContainer) prContainer.style.display = 'none';
	}
});

// Helper functions for package selection (can be expanded)
function getSelectedPackageId() {
	// Return the package id extracted early in the script
	return SELECTED_PACKAGE_ID || 'logo-basic';
}

function getOrderTotal() {
	// Prefer reading the numeric price from the selected SERVICE object
	try {
		const pkgId = getSelectedPackageId();
		console.debug('getOrderTotal: pkgId=', pkgId);
		if (typeof findService === 'function') {
			const pkg = findService(pkgId);
			console.debug('getOrderTotal: findService ->', pkg);
			if (pkg && pkg.price) {
				// price may be like "£199" or "£0.30" — strip non-numeric except dot and parse
				const num = String(pkg.price).replace(/[^0-9.]/g, '');
				const val = parseFloat(num);
				console.debug('getOrderTotal: parsed from pkg.price ->', val);
				if (!isNaN(val)) return val;
			}
		}
	} catch (e) { /* fallback below */ }
	// Fallback: Parse from the summary DOM element
	// Try to read the primary package price element if available
	const priceElCandidates = [
		document.getElementById('package-price'),
		document.getElementById('summary-total'),
		document.getElementById('summary-total-mobile'),
		document.getElementById('summary-total-mobile-bottom'),
	];
	for (const el of priceElCandidates) {
		if (el && el.textContent) {
			const totalText = el.textContent || el.innerText || '';
			const parsed = parseFloat(totalText.replace(/[^0-9.]/g, ''));
			if (!isNaN(parsed)) {
				console.debug('getOrderTotal: parsed from DOM', parsed, el.id || el);
				return parsed;
			}
		}
	}
	console.debug('getOrderTotal: unable to determine total, returning 0');
	return 0;
}

// Optional: Load package details from URL parameters
window.addEventListener('DOMContentLoaded', function() {
	// By this point, js/services.js should be loaded, so SERVICES and findService are available
	// Call loadPackageDetails to populate the package info in the DOM
	const pkgId = SELECTED_PACKAGE_ID || 'logo-basic';
	console.debug('DOMContentLoaded: loading package details for', pkgId);
	loadPackageDetails(pkgId);
	// Ensure summaries refresh on load
	try { updateSummaries(); } catch (e) {}
	
	// Initialize payment form with submit handler
	initializePaymentForm();
	
	// Pre-mount the Payment Element so the user sees the card input immediately
	// Get contact info or use defaults for initial mount
	const name = document.getElementById('customer_name')?.value?.trim() || 'Guest';
	const email = document.getElementById('customer_email')?.value?.trim() || 'guest@example.com';
	console.debug('DOMContentLoaded: pre-mounting Payment Element with name:', name, 'email:', email);
	ensurePaymentElement(name, email).catch(e => {
		console.error('Failed to pre-mount Payment Element:', e);
		// Show error to user
		const displayError = document.getElementById('payment_error_message');
		if (displayError) {
			displayError.textContent = 'Failed to load payment form. Please refresh the page.';
			displayError.classList.add('visible');
		}
	});
});

// Retry sync at multiple intervals to ensure SERVICES is available and DOM is ready
let retries = 0;
function retryUpdateSummaries() {
	retries++;
	console.debug('retryUpdateSummaries attempt', retries);
	try {
		// Check if SERVICES is available
		if (typeof SERVICES === 'undefined' || !SERVICES.length) {
			if (retries < 5) {
				setTimeout(retryUpdateSummaries, 100);
			}
			return;
		}
		// Ensure package details are loaded
		loadPackageDetailsImmediate(SELECTED_PACKAGE_ID);
		// SERVICES is available; update summaries
		updateSummaries();
	} catch (e) {
		console.error('retryUpdateSummaries error', e);
		if (retries < 5) {
			setTimeout(retryUpdateSummaries, 100);
		}
	}
}

// Start retrying immediately (don't wait for DOMContentLoaded)
retryUpdateSummaries();

// Also try a short delayed sync in case other scripts modify the DOM after load
setTimeout(function(){
	try { updateSummaries(); } catch(e){}
}, 500);

function formatCurrency(n){
	if (isNaN(n)) return '£0.00';
	return '£' + Number(n).toFixed(2);
}

function updateSummaries(){
	try{
		const total = getOrderTotal();
		const formatted = formatCurrency(total);
		// desktop
		var spName = document.getElementById('summary-package-name'); if (spName && typeof findService === 'function') { var pkg = findService(getSelectedPackageId()); if (pkg) spName.textContent = pkg.title; }
		var spPrice = document.getElementById('summary-package-price'); if (spPrice) spPrice.textContent = formatted;
		var st = document.getElementById('summary-total'); if (st) st.textContent = formatted;
		// mobile
		var spNameM = document.getElementById('summary-package-name-mobile'); if (spNameM && typeof findService === 'function') { var pkg2 = findService(getSelectedPackageId()); if (pkg2) spNameM.textContent = pkg2.title; }
		var spPriceM = document.getElementById('summary-package-price-mobile'); if (spPriceM) spPriceM.textContent = formatted;
		var stM = document.getElementById('summary-total-mobile'); if (stM) stM.textContent = formatted;
		var stMbot = document.getElementById('summary-total-mobile-bottom'); if (stMbot) stMbot.textContent = formatted;
		// update any toggle label
		var toggleLabel = document.querySelector('.summary-total-label span'); if (toggleLabel) toggleLabel.textContent = formatted;
		// Show debug info for troubleshooting (disabled by default)
		try{
			var dbg = document.getElementById('debug-banner');
			if(dbg){
				// Uncomment the line below to enable debug banner
				// dbg.style.display = 'block';
				var ref = document.referrer || '(none)';
				var stored = '(none)'; try{ stored = sessionStorage.getItem('fast_selected_package') || '(none)'; }catch(e){}
				dbg.textContent = 'Parsed package: ' + (getSelectedPackageId() || '(none)') + ' — Total: ' + formatted + ' — URL: ' + window.location.href + ' — referrer: ' + ref + ' — session: ' + stored;
			}
		}catch(e){}
	}catch(e){console.error('updateSummaries error', e)}
}

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
		try { sessionStorage.setItem('fast_selected_package', packageId); } catch (e) {}
		// Update main package card
		var pn = document.getElementById('package-name'); if (pn) pn.textContent = pkg.title;
		var pd = document.getElementById('package-desc'); if (pd) pd.textContent = pkg.shortDescription || pkg.longDescription || '';
		var pp = document.getElementById('package-price'); if (pp) pp.textContent = pkg.price;
		// Update summaries (desktop + mobile)
		updateSummaries();
	}
}
