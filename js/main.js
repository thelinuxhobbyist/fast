
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

  // helper to format meta keys (e.g. 'revis' -> 'Revisions')
  function formatMetaKey(k){
    var key = String(k||'');
    var lower = key.toLowerCase();
    if(/revis/.test(lower)) return 'Revisions';
    if(/format/.test(lower)) return 'Format';
    if(/turnaround|time|days/.test(lower)) return 'Turnaround';
    return key.replace(/[-_]/g,' ').split(' ').map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1); }).join(' ');
  }

  // Render snapshot on index (first 8)
  var snap = document.getElementById('packages-snapshot');
  if(snap && typeof SERVICES !== 'undefined'){
    SERVICES.slice(0,8).forEach(function(s){
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = '<h3>'+s.title+'</h3>' +
                       '<div class="package-price">'+s.price+'</div>' +
                       '<p>'+s.shortDescription+'</p>' +
                       '<div class="card-actions"><a class="cta" href="details.html?id='+encodeURIComponent(s.id)+'">View Details</a></div>';
      snap.appendChild(card);
    });
  }

  // Render full packages list on packages page
  var list = document.getElementById('packages-list');
  if(list && typeof SERVICES !== 'undefined'){
    SERVICES.forEach(function(s){
      var card = document.createElement('div'); card.className = 'card';
      var metaHtml = '';
      if(s.meta && typeof s.meta === 'object'){
        metaHtml = Object.entries(s.meta).map(function(kv){ return '<div><strong>'+ (formatMetaKey(kv[0]) )+':</strong> '+kv[1]+'</div>'; }).join('');
      }
      card.innerHTML = '<h3>'+s.title+'</h3>' +
                       '<div class="package-price">'+s.price+'</div>' +
                       '<div class="meta">'+metaHtml+'</div>' +
                       '<p>'+s.shortDescription+'</p>' +
                       '<div class="card-actions"><a class="cta" href="details.html?id='+encodeURIComponent(s.id)+'">View Details</a></div>';
      list.appendChild(card);
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
        gsap.from('#packages-snapshot .card', { opacity: 0, y: 20, duration: 0.6, stagger: 0.09, delay: 0.25, ease: 'power2.out' });
      } catch (e) { /* fail silently if animation errors */ }
    });
  }
} catch (e) {}