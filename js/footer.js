(function () {
  var inResources = window.location.pathname.indexOf('/resources/') !== -1;
  var b = inResources ? '../' : '';
  var path = window.location.pathname;
  var isCheckout = /checkout(\.html)?$/i.test(path) || /\/checkout$/i.test(path);

  var html;

  if (isCheckout) {
    html =
      '<footer class="site-footer site-footer--compact">' +
        '<div class="site-footer--compact__inner">' +
          '<nav class="site-footer--compact__links" aria-label="Footer links">' +
            '<a href="' + b + 'terms.html">Terms</a>' +
            '<a href="' + b + 'privacy.html">Privacy</a>' +
            '<a href="' + b + 'refund.html">Refund</a>' +
            '<a href="' + b + 'contact.html">Contact</a>' +
          '</nav>' +
          '<p class="site-footer--compact__copy">&copy; <span class="copyright-year"></span> Fast Graphic Design</p>' +
        '</div>' +
      '</footer>';
  } else {
    html =
      '<footer class="site-footer">' +
        '<div class="container site-footer__inner">' +
          '<div class="site-footer__main">' +
            '<div class="site-footer__brand">' +
              '<p class="site-footer__name">Fast Graphic Design</p>' +
              '<p class="site-footer__tagline">Professional design outsourcing for small businesses and agencies. Fixed pricing, fast turnaround, and white-label friendly — so you can deliver quality work without agency overheads.</p>' +
              '<div class="site-footer__actions">' +
                '<a class="site-footer__cta" href="' + b + 'contact.html#custom">Request a Custom Quote</a>' +
                '<a class="site-footer__cta site-footer__cta--outline" href="' + b + 'packages.html">View Packages</a>' +
              '</div>' +
            '</div>' +
            '<div class="site-footer__columns">' +
              '<div class="site-footer__col">' +
                '<p class="site-footer__col-title">Navigate</p>' +
                '<nav class="site-footer__nav">' +
                  '<a href="' + b + 'index.html">Home</a>' +
                  '<a href="' + b + 'packages.html">Packages</a>' +
                  '<a href="' + b + 'contact.html">Contact</a>' +
                  '<a href="' + b + 'resources/">Resources</a>' +
                '</nav>' +
              '</div>' +
              '<div class="site-footer__col">' +
                '<p class="site-footer__col-title">Legal</p>' +
                '<nav class="site-footer__nav">' +
                  '<a href="' + b + 'terms.html">Terms of Service</a>' +
                  '<a href="' + b + 'privacy.html">Privacy Policy</a>' +
                  '<a href="' + b + 'refund.html">Refund Policy</a>' +
                '</nav>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="site-footer__bar">' +
            '<p class="site-footer__copy">&copy; <span class="copyright-year"></span> Fast Graphic Design. All rights reserved.</p>' +
            '<div class="site-footer__social">' +
              '<a href="https://www.facebook.com/fastgraphicdesign" class="site-footer__social-link" aria-label="Facebook" title="Visit our Facebook"><i class="fa-brands fa-facebook"></i></a>' +
              '<a href="https://www.youtube.com/@fastgraphicdesign" class="site-footer__social-link" aria-label="YouTube" title="Visit our YouTube"><i class="fa-brands fa-youtube"></i></a>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  var mount = document.getElementById('site-footer');
  if (mount) mount.outerHTML = html;
})();
