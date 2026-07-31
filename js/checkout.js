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
// Flag that becomes true once the Payment Element is mounted and ready
let paymentElementReady = false;
// Flag that becomes true when the Payment Element reports all fields complete
let paymentElementComplete = false;

// Minimal Element styling (avoid using lineHeight to prevent Stripe warning)
const elementOptions = {
	// appearance and other options can be added here
};

// Handle form submission
let submitButton = null;
let buttonText = null;
let spinner = null;

function getSubmitButtons() {
	return Array.prototype.slice.call(document.querySelectorAll('#submit_payment, #submit_payment_mobile'));
}

function setSubmitButtonsDisabled(disabled) {
	getSubmitButtons().forEach(function (btn) {
		btn.disabled = disabled;
	});
}

function getPayBlockElements(btn) {
	var block = btn.closest('.checkout-pay-block');
	return {
		buttonText: block ? block.querySelector('.btn-checkout > span') : null,
		spinner: block ? block.querySelector('.spinner') : null
	};
}

function getFormElements() {
	if (!submitButton) {
		submitButton = document.getElementById('submit_payment') || document.getElementById('submit_payment_mobile');
		buttonText = document.getElementById('button-text') || document.getElementById('button-text-mobile');
		spinner = document.getElementById('spinner') || document.getElementById('spinner-mobile');
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
		var spnm = document.getElementById('summary-package-name-mobile'); if (spnm) spnm.textContent = pkg.title;
		var sppm = document.getElementById('summary-package-price-mobile'); if (sppm) sppm.textContent = pkg.price;
		var spd = document.getElementById('summary-package-desc-mobile'); if (spd) spd.textContent = pkg.shortDescription || pkg.longDescription || '';
		var sn = document.getElementById('summary-package-name'); if (sn) sn.textContent = pkg.title;
		var pp = document.getElementById('package-price'); if (pp) pp.textContent = pkg.price;
		var spp = document.getElementById('summary-package-price'); if (spp) spp.textContent = pkg.price;
	}
}
loadPackageDetailsImmediate(SELECTED_PACKAGE_ID);

// Function to attach click handler to button

function attachPaymentHandler(btn) {
	if (!btn) return;
	btn.addEventListener('click', async function(event) {
		event.preventDefault();

		var payEls = getPayBlockElements(btn);
		var btnText = payEls.buttonText;
		var spin = payEls.spinner;
			
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
			
			// Disable buttons and show loading state on clicked button
			setSubmitButtonsDisabled(true);
			if (btnText) btnText.style.display = 'none';
			if (spin) spin.classList.remove('hidden');
			
			// Process payment with Stripe
			processPayment(customerName, customerEmail, btn, btnText, spin);
	});
}

// Attach handler when DOM is ready
function initializePaymentForm() {
	getSubmitButtons().forEach(attachPaymentHandler);
}

// Ensure Payment Element is created and mounted (creates PaymentIntent via server)
async function ensurePaymentElement(name, email, forceRefresh = false) {
	// If already mounted and elements exists, no-op (unless forceRefresh is true)
	if (!forceRefresh && paymentElement && elements) return true;

	// If forceRefresh, unmount and clean up old elements
	if (forceRefresh && paymentElement) {
		try {
			paymentElement.unmount();
			paymentElement = null;
			paymentElementComplete = false;
			elements = null;
			console.log('Cleaned up old Payment Element');
		} catch (e) {
			console.warn('Error cleaning up old Payment Element:', e);
		}
	}

	// Create PaymentIntent on server
	const totalAmount = Math.round(getOrderTotal() * 100);
	
	// Log only non-PII details to avoid exposing emails/names in console
	console.log('Creating PaymentIntent:', {
		amount: totalAmount,
		currency: 'gbp',
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
			let errorData = {};
			try { errorData = await response.json(); } catch(e) { errorData = { error: 'Unknown server error' }; }
			console.error('API Error Response:', response.status, errorData);
			// Surface error to the user in the payment area so the cause is obvious
			try {
				const peg = document.getElementById('payment_element');
				if (peg) {
					peg.innerHTML = '<div style="padding:16px;border:1px solid #f2dede;background:#fff6f6;border-radius:8px;color:#b00020">Payment temporarily unavailable. Server error: ' + (errorData && errorData.error ? (errorData.error+'') : response.status) + '. Please contact support.</div>';
				}
				const dbg = document.getElementById('debug-banner'); if (dbg) { dbg.style.display='block'; dbg.textContent = 'API error: ' + (errorData && errorData.error ? errorData.error : 'Server error'); }
			} catch (e) { console.debug('Could not update payment UI with server error', e); }
			return { error: errorData.error || `Server error: ${response.status}` };
		}

		const data = await response.json();
		
		if (data.error) {
			console.error('PaymentIntent Error:', data.error);
			return { error: data.error };
		}

		const { clientSecret } = data || {};
		if (!clientSecret) {
			console.error('No clientSecret returned from /api/create-payment-intent', data);
			try { const peg = document.getElementById('payment_element'); if (peg) peg.innerHTML = '<div style="padding:16px;border:1px solid #f2dede;background:#fff6f6;border-radius:8px;color:#b00020">Payment setup failed (no client secret). Please try again or contact support.</div>'; } catch(e){}
			return { error: 'No client secret from server' };
		}
		// Do not log client secret or other sensitive data to console
		console.log('PaymentIntent created successfully');

		// Create Elements with clientSecret and mount Payment Element
		// Configure with UK-specific defaults (no postal code requirement)
		const appearance = {
			theme: 'stripe',
			variables: {
				colorPrimary: '#F58731',
				fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
				fontSizeBase: '15px',
				spacingUnit: '3px',
				borderRadius: '8px',
			}
		};
		elements = stripe.elements({ clientSecret, appearance });
		// For debugging: allow falling back to the legacy `card` Element by
		// adding `?use_card_element=1` to the URL. This helps determine if
		// the Payment Element iframe is being hidden by CSS or browser settings.
		const useCardElement = (new URLSearchParams(window.location.search).get('use_card_element') === '1');

		if (useCardElement) {
			paymentElement = elements.create('card', { hidePostalCode: true });
		} else {
			// Let the Payment Element collect billing details automatically.
			// Using 'auto' avoids needing to pass billing address fields
			// manually when calling `stripe.confirmPayment()`.
			paymentElement = elements.create('payment', {
				layout: {
					type: 'accordion',
					defaultCollapsed: false,
					radios: false,
					spacedAccordionItems: false
				},
				restrictPaymentMethods: ['card', 'link'],
				fields: { billingDetails: 'auto' }
			});
		}
		const mountPoint = document.getElementById('payment_element');
		if (mountPoint) {
			mountPoint.innerHTML = '';
			paymentElement.mount('#payment_element');
			console.log('Payment Element mounted successfully');

			// Enable visible debug banner for troubleshooting (shows helpful state)
			try {
				const dbg = document.getElementById('debug-banner');
				if (dbg) {
					dbg.style.display = 'block';
					dbg.textContent = 'Payment Element mounted';
				}
			} catch (e) { console.debug('debug-banner not available', e); }

			// Mark readiness. Stripe Payment Element emits a 'ready' event in many builds;
			// if it isn't available we'll assume readiness after a short delay.
			paymentElementReady = false;
			try {
				if (paymentElement && typeof paymentElement.on === 'function') {
					paymentElement.on('ready', function(){ paymentElementReady = true; console.log('Payment Element ready'); });
					// Some versions may already be ready immediately after mount
					setTimeout(function(){ if (!paymentElementReady) { paymentElementReady = true; console.log('Payment Element assumed ready after mount'); }}, 300);
				} else {
					setTimeout(function(){ paymentElementReady = true; console.log('Payment Element assumed ready (no ready event)'); }, 250);
				}
			} catch (e) { paymentElementReady = true; console.debug('ready listener failed', e); }
			
			// Enable submit button when Payment Element is ready
			setSubmitButtonsDisabled(false);
			console.log('Submit button enabled');
			
			// Listen for Payment Element state changes to enable/disable button
			if (paymentElement && typeof paymentElement.on === 'function') {
				paymentElement.on('change', function(event) {
					paymentElementComplete = !!event.complete;
					setSubmitButtonsDisabled(!!event.error || !event.complete);
					// Detailed debug output for troubleshooting incomplete-field issues
					try {
						console.log('Payment Element change event:', event);
						const dbg = document.getElementById('debug-banner');
						if (dbg) dbg.textContent = 'Payment Element change - complete=' + !!event.complete + (event.error ? ' error=' + (event.error.message||event.error.type) : '');
					} catch (e) { console.debug('debug update failed', e); }
				});
			}
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
		
		// Ensure a Payment Element is mounted for this transaction (do NOT force-refresh
		// on submit as that can unmount the element and clear user-entered card data)
		const ensure = await ensurePaymentElement(name, email, false);
		if (ensure && ensure.error) {
			console.error('Payment Element error:', ensure.error);
			showError(ensure.error, btn, btnText, spin);
			return;
		}

		console.log('Confirming payment with Stripe...');

		// Wait for Payment Element readiness (avoid IntegrationError when element not yet ready)
		function waitFor(ms){return new Promise(r=>setTimeout(r,ms));}
		async function waitUntil(predicate, timeout=5000, interval=50){const start=Date.now(); while(!predicate()){ if(Date.now()-start>timeout) return false; await waitFor(interval);} return true;}
		const ready = await waitUntil(()=>paymentElementReady, 5000);
		if (!ready) {
			console.error('Payment Element not ready after waiting');
			showError('Payment form not ready. Please refresh the page.', btn, btnText, spin);
			return;
		}

		// Ensure user has completed entering card details (avoid incomplete field errors)
		const completeReady = await waitUntil(()=>paymentElementComplete === true, 5000);
		if (!completeReady) {
			console.error('Payment Element fields incomplete before confirm');
			showError('Please complete your card details before submitting.', btn, btnText, spin);
			return;
		}
		
		// Set a timeout for payment confirmation (60 seconds)
		const confirmStart = Date.now();
		let paymentTimeout = setTimeout(() => {
			console.error('Payment confirmation timeout after 60 seconds');
			showError('Payment processing took too long. Please try again. Check the browser console for details.', btn, btnText, spin);
		}, 60000);
		
		// Confirm the payment using the Payment Element. redirect:'if_required' keeps handling inline when possible
		// Since we set billingDetails: 'never' in the Payment Element, we must pass billing details in confirmParams
		console.log('Calling stripe.confirmPayment()');
		const countryDefault = (navigator.language && navigator.language.toLowerCase().includes('en-gb')) ? 'GB' : 'GB';
		const confirmParams = {
			// Return directly to the server-side success route to avoid
			// an extra client-side redirect that can cause a visible flicker.
			return_url: window.location.origin + '/success'
		};
		console.log('confirmParams being sent to stripe.confirmPayment (no secrets):', confirmParams);
		const confirmResult = await stripe.confirmPayment({ elements, confirmParams, redirect: 'if_required' });

		clearTimeout(paymentTimeout);
		const confirmDuration = Date.now() - confirmStart;
		console.log('stripe.confirmPayment() completed in', confirmDuration, 'ms');
		// Avoid dumping the full Stripe response (may contain PII/payment details)
		console.log('confirmPayment completed');

		if (!confirmResult) {
			console.error('confirmPayment returned undefined');
			showError('Payment processing error: No response from Stripe', btn, btnText, spin);
			return;
		}

		if (confirmResult.error) {
			const errorMsg = confirmResult.error.message || 'Payment failed';
			console.error('Stripe error:', errorMsg, 'type=', confirmResult.error.type, 'code=', confirmResult.error.code, confirmResult.error);
			showError(errorMsg, btn, btnText, spin);
			return;
		}

		if (confirmResult.paymentIntent) {
			console.log('Payment status:', confirmResult.paymentIntent.status);
			
			if (confirmResult.paymentIntent.status === 'succeeded') {
				console.log('Payment succeeded! Redirecting to success page...');
				// Navigate directly to the server-side success endpoint (no intermediate static page)
				window.location.href = '/success?payment_intent=' + confirmResult.paymentIntent.id;
				return;
			}
			
			if (confirmResult.paymentIntent.status === 'processing') {
				console.log('Payment is processing...');
				showError('Payment is processing. Please wait and do not refresh the page.', btn, btnText, spin);
				return;
			}
		}

		// If the confirm result didn't include a paymentIntent (redirect pending), the browser will redirect automatically.
		console.log('Payment processing - redirect may occur');

	} catch (error) {
		console.error('Payment processing error:', error);
		const msg = (error && error.message) ? error.message : 'An error occurred. Please try again.';
		showError(msg, btn, btnText, spin);
	}
}

function showError(message, btn, btnText, spin) {
	const displayError = document.getElementById('payment_error_message') || document.getElementById('card-errors') || document.getElementById('payment_error');
	if (displayError) {
		displayError.textContent = message;
		displayError.classList.add('visible');
	} else {
		// Fallback to alert if no DOM target
		try { alert(message); } catch(e) { console.error('Unable to show error to user', e); }
	}
	console.error('Payment error displayed to user:', message);
	// Re-enable buttons safely
	setSubmitButtonsDisabled(false);
	getSubmitButtons().forEach(function (payBtn) {
		var payEls = getPayBlockElements(payBtn);
		try { if (payEls.buttonText) payEls.buttonText.style.display = 'flex'; } catch (e) {}
		try { if (payEls.spinner) payEls.spinner.classList.add('hidden'); } catch (e) {}
	});
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

function formatPayLabel(total, pkg) {
	var amount = (pkg && pkg.price) ? pkg.price : formatCurrency(total);
	return 'Pay ' + amount;
}

function updatePayButtonLabels(total, pkg) {
	var label = formatPayLabel(total, pkg);
	['button-text', 'button-text-mobile'].forEach(function (id) {
		var el = document.getElementById(id);
		if (el) el.innerHTML = '<i class="fa-solid fa-lock"></i> ' + label;
	});
}

function updateSummaries(){
	try{
		const total = getOrderTotal();
		const formatted = formatCurrency(total);
		const pkg = (typeof findService === 'function') ? findService(getSelectedPackageId()) : null;
		const displayPrice = (pkg && pkg.price) ? pkg.price : formatted;

		// desktop
		var spName = document.getElementById('summary-package-name'); if (spName && pkg) spName.textContent = pkg.title;
		var spPrice = document.getElementById('summary-package-price'); if (spPrice) spPrice.textContent = displayPrice;
		var st = document.getElementById('summary-total'); if (st) st.textContent = displayPrice;

		// mobile
		var spNameM = document.getElementById('summary-package-name-mobile'); if (spNameM && pkg) spNameM.textContent = pkg.title;
		var spPriceM = document.getElementById('summary-package-price-mobile'); if (spPriceM) spPriceM.textContent = displayPrice;
		var stM = document.getElementById('summary-total-mobile'); if (stM) stM.textContent = displayPrice;
		var stMbot = document.getElementById('summary-total-mobile-bottom'); if (stMbot) stMbot.textContent = displayPrice;
		var ppHidden = document.getElementById('package-price'); if (ppHidden && pkg && pkg.price) ppHidden.textContent = pkg.price;

		updatePayButtonLabels(total, pkg);
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
		var spnm = document.getElementById('summary-package-name-mobile'); if (spnm) spnm.textContent = pkg.title;
		var sppm = document.getElementById('summary-package-price-mobile'); if (sppm) sppm.textContent = pkg.price;
		var spd = document.getElementById('summary-package-desc-mobile'); if (spd) spd.textContent = pkg.shortDescription || pkg.longDescription || '';
		var sn = document.getElementById('summary-package-name'); if (sn) sn.textContent = pkg.title;
		var pp = document.getElementById('package-price'); if (pp) pp.textContent = pkg.price;
		var spp = document.getElementById('summary-package-price'); if (spp) spp.textContent = pkg.price;
		// Update summaries (desktop + mobile)
		updateSummaries();
	}
}
