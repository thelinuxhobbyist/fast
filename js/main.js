
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getMetaIcon(key) {
  var k = String(key || '').toLowerCase();
  if (/revis/.test(k)) return 'fa-pen-fancy';
  if (/format|file|type/.test(k)) return 'fa-file-lines';
  if (/turnaround|time|days|hour/.test(k)) return 'fa-clock';
  if (/platform|platforms/.test(k)) return 'fa-layer-group';
  if (/page/.test(k)) return 'fa-copy';
  if (/size/.test(k)) return 'fa-ruler-combined';
  if (/product|count/.test(k)) return 'fa-box';
  if (/photo|image/.test(k)) return 'fa-image';
  if (/tool|service|edit/.test(k)) return 'fa-wrench';
  return 'fa-circle-check';
}

function formatMetaKey(k) {
  var key = String(k || '');
  var lower = key.toLowerCase();
  if (/revis/.test(lower)) return 'Revisions';
  if (/format/.test(lower)) return 'Format';
  if (/turnaround|time|days/.test(lower)) return 'Turnaround';
  if (/platform/.test(lower)) return 'Platform';
  if (/page/.test(lower)) return 'Pages';
  if (/size/.test(lower)) return 'Size';
  if (/product/.test(lower)) return 'Products';
  if (/count/.test(lower)) return 'Includes';
  if (/service/.test(lower)) return 'Service';
  if (/tool/.test(lower)) return 'Tools';
  if (/edit/.test(lower)) return 'Edits';
  if (/photo/.test(lower)) return 'Photos';
  if (/type/.test(lower)) return 'Type';
  return key.replace(/[-_]/g, ' ').split(' ').map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ');
}

function parsePricePence(price) {
  var num = String(price || '').replace(/[^0-9.]/g, '');
  var pounds = parseFloat(num);
  if (isNaN(pounds)) return null;
  return Math.round(pounds * 100);
}

function buildPackageCard(s, options) {
  options = options || {};
  var maxFeatures = options.maxFeatures != null ? options.maxFeatures : 4;
  var maxMeta = options.maxMeta != null ? options.maxMeta : 4;
  var isPopular = !!s.popular;

  var metaHtml = '';
  if (s.meta && typeof s.meta === 'object') {
    metaHtml = Object.entries(s.meta).slice(0, maxMeta).map(function (kv) {
      var label = formatMetaKey(kv[0]);
      var icon = getMetaIcon(kv[0]);
      return '<li class="package-card__meta-item"><i class="fa-solid ' + icon + '" aria-hidden="true"></i><span><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(kv[1]) + '</span></li>';
    }).join('');
  }

  var featuresHtml = '';
  if (s.features && s.features.length) {
    featuresHtml = s.features.slice(0, maxFeatures).map(function (f) {
      return '<li class="package-card__feature"><i class="fa-solid fa-check" aria-hidden="true"></i><span>' + escapeHtml(f) + '</span></li>';
    }).join('');
  }

  var card = document.createElement('article');
  card.className = 'package-card' + (isPopular ? ' package-card--popular' : '');
  card.innerHTML =
    (isPopular ? '<div class="package-card__badge" aria-label="Most Popular package">Most Popular</div>' : '') +
    '<div class="package-card__body">' +
      '<h3 class="package-card__title">' + escapeHtml(s.title) + '</h3>' +
      '<div class="package-card__price">' + escapeHtml(s.price) + '</div>' +
      (metaHtml ? '<ul class="package-card__meta">' + metaHtml + '</ul>' : '') +
      (featuresHtml ? '<ul class="package-card__features">' + featuresHtml + '</ul>' : '') +
      (s.shortDescription ? '<p class="package-card__desc">' + escapeHtml(s.shortDescription) + '</p>' : '') +
    '</div>' +
    '<div class="package-card__footer">' +
      '<a class="package-card__cta' + (isPopular ? ' package-card__cta--popular' : '') + '" href="details.html?id=' + encodeURIComponent(s.id) + '">View Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
    '</div>';
  return card;
}

function injectPackagesSchema(services) {
  if (!services || !services.length) return;
  var existing = document.getElementById('packages-jsonld');
  if (existing) existing.remove();

  var origin = window.location.origin || 'https://fastgraphic.co.uk';
  var items = services.map(function (s, index) {
    var pence = parsePricePence(s.price);
    var offer = {
      '@type': 'Offer',
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      url: origin + '/details.html?id=' + encodeURIComponent(s.id)
    };
    if (pence != null) offer.price = (pence / 100).toFixed(2);

    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: s.title,
        description: s.shortDescription || s.longDescription || '',
        provider: {
          '@type': 'Organization',
          name: 'Fast Graphic Design'
        },
        offers: offer
      }
    };
  });

  var schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Fast Graphic Design Packages',
    description: 'Fixed-price design and web packages for small businesses.',
    numberOfItems: items.length,
    itemListElement: items
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'packages-jsonld';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function buildDetailsIncludesHtml(s) {
  if (!s.meta || typeof s.meta !== 'object') return '';
  var items = Object.entries(s.meta).map(function (kv) {
    var label = formatMetaKey(kv[0]);
    var icon = getMetaIcon(kv[0]);
    return '<li class="details-includes__item">' +
      '<i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
      '<span class="details-includes__text"><strong>' + escapeHtml(label) + ':</strong> ' + escapeHtml(kv[1]) + '</span>' +
    '</li>';
  }).join('');
  if (!items) return '';
  return '<section class="details-section details-includes">' +
    '<h2 class="details-section__title">What\'s Included</h2>' +
    '<ul class="details-includes__list">' + items + '</ul>' +
  '</section>';
}

function buildDetailsFaqHtml() {
  var faqs = [
    { q: 'What if I don\'t love my design?', a: 'We offer a 30-day money-back guarantee, no questions asked. Your satisfaction is guaranteed.' },
    { q: 'Can I request changes?', a: 'Yes! This package includes revisions so we can get your design perfect.' },
    { q: 'How long does it take?', a: 'First draft is delivered quickly — turnaround depends on the package, typically within 2–7 days.' },
    { q: 'Do I own the files?', a: 'Yes. You receive full commercial use rights and can use your files however you like.' }
  ];
  var items = faqs.map(function (faq, i) {
    return '<div class="faq-accordion__item">' +
      '<button class="faq-accordion__trigger" type="button" aria-expanded="false" aria-controls="faq-panel-' + i + '" id="faq-trigger-' + i + '">' +
        '<span>' + escapeHtml(faq.q) + '</span>' +
        '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
      '</button>' +
      '<div class="faq-accordion__panel" id="faq-panel-' + i + '" role="region" aria-labelledby="faq-trigger-' + i + '" hidden>' +
        '<p>' + escapeHtml(faq.a) + '</p>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<section class="details-section details-faq">' +
    '<h2 class="details-section__title">Frequently Asked Questions</h2>' +
    '<div class="faq-accordion">' + items + '</div>' +
  '</section>';
}

function initFaqAccordion(container) {
  if (!container) return;
  container.querySelectorAll('.faq-accordion__trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      btn.classList.toggle('is-open', !isOpen);
      if (panel) panel.hidden = isOpen;
    });
  });
}

function buildPriceCardHtml(s) {
  var popularBadge = s.popular
    ? '<span class="price-card__popular">Most Popular</span>'
    : '';
  return '<aside class="price-card' + (s.popular ? ' price-card--popular' : '') + '">' +
    popularBadge +
    '<div class="price-card__header">' +
      '<span class="price-card__label">Price</span>' +
      '<div class="price-card__amount">' + escapeHtml(s.price) + '</div>' +
      '<span class="price-card__note">One-time payment · No hidden fees</span>' +
    '</div>' +
    '<a class="price-card__cta" href="checkout.html?package=' + encodeURIComponent(s.id) + '" onclick="try{sessionStorage.setItem(\'fast_selected_package\', \'' + encodeURIComponent(s.id) + '\');}catch(e){}">' +
      'Order Now <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>' +
    '</a>' +
  '</aside>';
}

function buildCustomQuoteHtml() {
  return '<aside class="details-custom-box">' +
    '<h2 class="details-custom-box__title">Need something different?</h2>' +
    '<p>We also quote custom work beyond these packages.</p>' +
    '<a class="details-custom-box__link" href="contact.html#custom">Request Custom Quote <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
  '</aside>';
}

function buildFeaturesSectionHtml(s) {
  if (!s.features || !s.features.length) return '';
  var list = '<ul class="details-features">' +
    s.features.map(function (f) {
      return '<li><i class="fa-solid fa-check" aria-hidden="true"></i><span>' + escapeHtml(f) + '</span></li>';
    }).join('') +
  '</ul>';
  return '<section class="details-section details-features-block">' +
    '<h2 class="details-section__title">Features</h2>' + list +
  '</section>';
}

function renderServiceDetails(s, container) {
  var includesHtml = buildDetailsIncludesHtml(s);
  var featuresHtml = buildFeaturesSectionHtml(s);
  var priceCardHtml = buildPriceCardHtml(s);

  container.innerHTML =
    '<div class="details-layout">' +
      '<div class="details-intro">' +
        '<h1 class="details-title">' + escapeHtml(s.title) + '</h1>' +
        (s.shortDescription ? '<p class="details-lead">' + escapeHtml(s.shortDescription) + '</p>' : '') +
      '</div>' +
      '<div class="details-sidebar">' + priceCardHtml + buildCustomQuoteHtml() + '</div>' +
      includesHtml +
      featuresHtml +
      buildDetailsFaqHtml() +
    '</div>';

  initFaqAccordion(container.querySelector('.faq-accordion'));
  document.title = s.title + ' \u2014 Fast Graphic Design';
}

document.addEventListener('DOMContentLoaded', function(){
  // Mobile nav toggles
  var toggles = document.querySelectorAll('.menu-toggle');
  toggles.forEach(function(btn){
    btn.addEventListener('click', function(){
      var nav = document.querySelector('#nav') || document.querySelector('#navP') || document.querySelector('#navC') || document.querySelector('#navD');
      if(nav){
        nav.classList.toggle('active');
        // Change button icon when menu is open
        btn.innerHTML = nav.classList.contains('active') ? '<i class="fa fa-times"></i>' : '<i class="fa fa-bars"></i>';
      }
    });
  });
  
  // Close mobile menu when clicking a link
  var navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(function(link){
    link.addEventListener('click', function(){
      var nav = document.querySelector('#nav') || document.querySelector('#navP') || document.querySelector('#navC') || document.querySelector('#navD');
      if(nav && nav.classList.contains('active')){
        nav.classList.remove('active');
        var btn = document.querySelector('.menu-toggle');
        if(btn) btn.innerHTML = '<i class="fa fa-bars"></i>';
      }
    });
  });

  // Render snapshot on index (first 8)
  var snap = document.getElementById('packages-snapshot');
  if (snap && typeof SERVICES !== 'undefined') {
    SERVICES.slice(0, 8).forEach(function (s) {
      snap.appendChild(buildPackageCard(s, { maxFeatures: 3, maxMeta: 3 }));
    });
  }

  // Render full packages list on packages page
  var list = document.getElementById('packages-list');
  if (list && typeof SERVICES !== 'undefined') {
    SERVICES.forEach(function (s) {
      list.appendChild(buildPackageCard(s));
    });
    injectPackagesSchema(SERVICES);
  }

  // Details page rendering
  var details = document.getElementById('service-details');
  if (details && typeof SERVICES !== 'undefined') {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var s = findService(id);
    if (!s) {
      details.innerHTML = '<div class="details-not-found"><h2>Service not found</h2><p><a href="packages.html">Back to packages</a></p></div>';
      return;
    }
    renderServiceDetails(s, details);
    injectPackagesSchema([s]);
  }

});

// GSAP animations: animate hero and package cards when GSAP is available
try {
  if (typeof gsap !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function(){
      try {
        gsap.from('.hero h1', { opacity: 0, y: 18, duration: 0.8, ease: 'power2.out' });
        gsap.from('.hero p', { opacity: 0, y: 14, duration: 0.7, delay: 0.12, ease: 'power2.out' });
        gsap.from('#packages-snapshot .package-card', { opacity: 0, y: 20, duration: 0.6, stagger: 0.09, delay: 0.25, ease: 'power2.out' });
      } catch (e) { /* fail silently if animation errors */ }
    });
  }
} catch (e) {}