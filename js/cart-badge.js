(function () {
  function updateCartBadge() {
    try {
      var cart = JSON.parse(localStorage.getItem('cm_cart') || '[]');
      var count = cart.reduce(function (s, i) { return s + (i.qty || 1); }, 0);
      document.querySelectorAll('.cart-icon-wrap .cart-badge').forEach(function (badge) {
        if (count > 0) {
          badge.textContent = count > 9 ? '9+' : count;
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
  } else {
    updateCartBadge();
  }
  window.addEventListener('storage', updateCartBadge);
  window.updateCartBadge = updateCartBadge;
})();
