
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

function buildPackageCard(s, options) {
  options = options || {};
  var maxFeatures = options.maxFeatures != null ? options.maxFeatures : 4;
  var maxMeta = options.maxMeta != null ? options.maxMeta : 4;

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
  card.className = 'package-card';
  card.innerHTML =
    '<div class="package-card__body">' +
      '<h3 class="package-card__title">' + escapeHtml(s.title) + '</h3>' +
      '<div class="package-card__price">' + escapeHtml(s.price) + '</div>' +
      (metaHtml ? '<ul class="package-card__meta">' + metaHtml + '</ul>' : '') +
      (featuresHtml ? '<ul class="package-card__features">' + featuresHtml + '</ul>' : '') +
      (s.shortDescription ? '<p class="package-card__desc">' + escapeHtml(s.shortDescription) + '</p>' : '') +
    '</div>' +
    '<div class="package-card__footer">' +
      '<a class="package-card__cta" href="details.html?id=' + encodeURIComponent(s.id) + '">View Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
    '</div>';
  return card;
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
  }

  // Details page rendering with two-column layout
  var details = document.getElementById('service-details');
  if(details && typeof SERVICES !== 'undefined'){
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var s = findService(id);
    if(!s){
      details.innerHTML = '<h2>Service not found</h2><p><a href="packages.html">Back to packages</a></p>';
      return;
    }
    // build left content (text only - no duplication)
    var featuresHtml = '<ul class="features-list">'+ (s.features||[]).map(function(f){ return '<li>'+f+'</li>'; }).join('') +'</ul>';
    var customSection = '<div style="padding:20px;background:#f9f9f9;border-radius:10px;border-left:4px solid var(--accent)"><h3 style="margin-top:0;color:var(--accent)">Need Something Different?</h3><p style="color:#666;margin:8px 0">Have a unique project in mind? We offer custom quotes for work beyond our standard packages.</p><a class="btn" href="contact.html#custom" style="display:inline-block;margin-top:10px;background:var(--accent);color:#fff;padding:10px 16px;font-weight:700">Request Custom Quote</a></div>';
    var faqContent = '<div class="faq-section"><h3 style="margin:18px 0 12px 0;color:var(--accent)">Frequently Asked Questions</h3><div class="faq-item"><div class="faq-question"><i class="fa-solid fa-circle-question"></i> What if I don\'t love my design?</div><div class="faq-answer">We offer a 30-day money-back guarantee, no questions asked. Your satisfaction is guaranteed.</div></div><div class="faq-item"><div class="faq-question"><i class="fa-solid fa-circle-question"></i> Can I request changes?</div><div class="faq-answer">Yes! This package includes 2 rounds of free revisions to get your design perfect.</div></div><div class="faq-item"><div class="faq-question"><i class="fa-solid fa-circle-question"></i> How long does it take?</div><div class="faq-answer">First draft delivered within 48 hours. Revisions and final files follow quickly after.</div></div><div class="faq-item"><div class="faq-question"><i class="fa-solid fa-circle-question"></i> Do I own the files?</div><div class="faq-answer">100% yes. You\'ll receive full copyright ownership and can use them however you like.</div></div></div>';
    var leftHtml = '<div style="display:flex;flex-direction:column;gap:24px"><h1>'+s.title+'</h1><p style="margin:0;color:#666">'+(s.longDescription||'')+'</p>'+featuresHtml+'</div>';
    var supportingHtml = '<div style="display:flex;flex-direction:column;gap:24px">'+customSection+faqContent+'</div>';
    
    // build right price card (with meta info and trust)
    var metaHtmlRight = '';
    if(s.meta && typeof s.meta === 'object'){
      metaHtmlRight = Object.entries(s.meta).map(function(kv){
        var key = kv[0];
        var val = kv[1];
        var icon = '';
        if(/turnaround|time|days/i.test(key)) icon = '<i class="fa-solid fa-clock"></i>';
        else if(/format|file|format/i.test(key)) icon = '<i class="fa-solid fa-file"></i>';
        else if(/revis/i.test(key)) icon = '<i class="fa-solid fa-pen-fancy"></i>';
        else icon = '<i class="fa-solid fa-info-circle"></i>';
        return '<div class="meta-item">'+icon+'<div><strong>'+key+':</strong><div style="color:var(--muted)">'+val+'</div></div></div>';
      }).join('');
    }
    var rightHtml = '<aside class="price-card"><div style="text-align:center;margin-bottom:20px"><div class="price-sub">Price</div><div class="price-big">'+s.price+'</div><div class="price-sub" style="font-size:12px;color:var(--green);font-weight:700">One-time payment • No hidden fees</div></div><div style="background:linear-gradient(135deg,rgba(164,206,57,0.08),rgba(11,102,51,0.05));padding:14px;border-radius:8px;margin-bottom:16px"><a class="btn-primary btn btn-primary-cta" href="checkout.html?package='+encodeURIComponent(s.id)+'" onclick="try{sessionStorage.setItem(\'fast_selected_package\', \''+encodeURIComponent(s.id)+'\');}catch(e){}" style="width:100%;background:var(--accent);box-shadow:0 8px 24px rgba(11, 102, 102, 0.3)"><span class="btn-icon">✓</span> Order Your Design Now</a></div><div class="meta-list" style="border-top:1px solid #eee;padding-top:14px;margin-bottom:16px">'+metaHtmlRight+'</div><div class="trust-section"><div class="trust-badge"><i class="fa-solid fa-star" style="color:#ffc107"></i> <span><strong>Rated 4.9/5</strong> by 300+ Clients</span></div><div class="trust-item"><i class="fa-solid fa-shield-halved" style="color:var(--green)"></i> <span>30-Day Money-Back Guarantee</span></div><div class="trust-item"><i class="fa-solid fa-bolt" style="color:var(--accent)"></i> <span>First Draft in 48 Hours</span></div><div class="trust-item"><i class="fa-solid fa-undo" style="color:var(--green)"></i> <span>2 Rounds of Free Revisions</span></div></div></aside>';
    details.innerHTML = '<div class="details-layout"><div class="details-main">'+leftHtml+'</div><div class="details-price">'+rightHtml+'</div><div class="details-supporting">'+supportingHtml+'</div></div>';
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