document.querySelectorAll('.copyright-year').forEach(function (el) {
  el.textContent = String(new Date().getFullYear());
});
