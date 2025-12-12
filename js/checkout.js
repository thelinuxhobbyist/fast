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
const stripe = Stripe('pk_test_51STTem2KkObKPVCjWYundub4WiyxnWFMZZvulyXPNQSrpe8LfO89doMDHZXy6bg02BAOZyGDllziDTGVFcnhEYkU00QCdNmDJ3', { locale: 'en-GB' });

// We'll create Elements & the Payment Element dynamically after we receive a client secret
let elements = null;
let paymentElement = null;

// Minimal Element styling (avoid using lineHeight to prevent Stripe warning)
const elementOptions = {
	// appearance and other options can be added here
};

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

// Ensure Payment Element is created and mounted (creates PaymentIntent via server)
async function ensurePaymentElement(name, email) {
	// If already mounted and elements exists, no-op
	if (paymentElement && elements) return true;

	// Create PaymentIntent on server
	const totalAmount = Math.round(getOrderTotal() * 100);
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
		return { error: data.error };
	}

	const { clientSecret } = data;

	// Create Elements with clientSecret and mount Payment Element
	elements = stripe.elements({ clientSecret });
	paymentElement = elements.create('payment', elementOptions);
	const mountPoint = document.getElementById('card-element');
	if (mountPoint) {
		mountPoint.innerHTML = '';
		paymentElement.mount('#card-element');
	}

	return { clientSecret };
}

// Process payment with Stripe using the Payment Element
async function processPayment(name, email, btn, btnText, spin) {
	try {
		const ensure = await ensurePaymentElement(name, email);
		if (ensure && ensure.error) {
			showError(ensure.error, btn, btnText, spin);
			return;
		}

		// Confirm the payment using the Payment Element. redirect:'if_required' keeps handling inline when possible
		const confirmResult = await stripe.confirmPayment({
			elements,
			confirmParams: { return_url: window.location.origin + '/success.html' },
			redirect: 'if_required'
		});

		if (confirmResult && confirmResult.error) {
			showError(confirmResult.error.message || 'Payment failed', btn, btnText, spin);
			return;
		}

		if (confirmResult && confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
			window.location.href = 'success.html?payment_intent=' + confirmResult.paymentIntent.id;
			return;
		}

		// If the confirm result didn't include a paymentIntent (redirect pending), the browser will redirect automatically.

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
	// Prefer the runtime-selected package id (set by loadPackageDetails)
	if (typeof SELECTED_PACKAGE_ID !== 'undefined' && SELECTED_PACKAGE_ID) return SELECTED_PACKAGE_ID;
	// Fallback to URL parameter
	const urlParams = new URLSearchParams(window.location.search);
	const param = urlParams.get('package');
	if (param) return param;
	// Fallback to sessionStorage (set when navigating from packages list)
	try {
		const stored = sessionStorage.getItem('fast_selected_package');
		if (stored) {
			// try returning decoded value if appropriate
			try { return decodeURIComponent(stored); } catch (e) { return stored; }
		}
	} catch (e) {}
	// Fallback to parsing referrer (if user clicked link from another page)
	try {
		if (document.referrer) {
			try {
				const refUrl = new URL(document.referrer);
				const p = new URLSearchParams(refUrl.search).get('package');
				if (p) return p;
			} catch (e) {}
		}
	} catch (e) {}
	return 'logo-basic';
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
	const urlParams = new URLSearchParams(window.location.search);
	const packageId = urlParams.get('package');
	
	if (packageId) {
		loadPackageDetails(packageId);
	}
	// Ensure summaries refresh on load
	try { updateSummaries(); } catch (e) {}
});

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
		// Show debug info for troubleshooting
		try{
			var dbg = document.getElementById('debug-banner');
			if(dbg){
				dbg.style.display = 'block';
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
