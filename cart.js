/* ============================================
   VISION — Shared Cart System
   Add this script to both index.html and shop.html
   ============================================ */

(function() {

  // ── CART STATE ──────────────────────────────
  function getCart() {
    try { return JSON.parse(localStorage.getItem('vision_cart') || '[]'); }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem('vision_cart', JSON.stringify(cart));
  }
  function addToCart(name, price, type, size) {
    const cart = getCart();
    const key = name + '|' + (size || 'OS');
    const existing = cart.find(i => i.key === key);
    if (existing) { existing.qty++; }
    else { cart.push({ key, name, price: parseFloat(price.toString().replace('$','')), type, size: size || 'OS', qty: 1 }); }
    saveCart(cart);
    renderCart();
    openCart();
    animateCartBump();
  }
  function removeFromCart(key) {
    const cart = getCart().filter(i => i.key !== key);
    saveCart(cart);
    renderCart();
  }
  function updateQty(key, delta) {
    const cart = getCart();
    const item = cart.find(i => i.key === key);
    if (item) { item.qty += delta; if (item.qty <= 0) return removeFromCart(key); }
    saveCart(cart);
    renderCart();
  }

  // ── SIZE PICKER POPUP ────────────────────────
  function openSizePicker(name, price, type, anchorEl) {
    closeSizePicker();
    const sizes = /(pants|pant|track)/i.test(type)
      ? ['28','30','32','34']
      : /(accessories|cap|beanie|hat)/i.test(type)
      ? ['OS']
      : ['XS','S','M','L','XL'];

    const picker = document.createElement('div');
    picker.id = 'vc-size-picker';
    picker.innerHTML = `
      <p class="vsp-label">Select Size</p>
      <div class="vsp-sizes">
        ${sizes.map(s => `<button class="vsp-btn" data-size="${s}">${s}</button>`).join('')}
      </div>
    `;
    document.body.appendChild(picker);

    // Position near the card
    const rect = anchorEl.getBoundingClientRect();
    picker.style.top = (rect.top + window.scrollY - picker.offsetHeight - 12) + 'px';
    picker.style.left = (rect.left + rect.width/2 - 100) + 'px';
    // Reposition after render
    requestAnimationFrame(() => {
      picker.style.top = (rect.top + window.scrollY - picker.offsetHeight - 12) + 'px';
      picker.style.left = Math.max(8, rect.left + rect.width/2 - picker.offsetWidth/2) + 'px';
      picker.classList.add('open');
    });

    picker.querySelectorAll('.vsp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(name, price, type, btn.dataset.size);
        closeSizePicker();
      });
    });

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', outsidePickerClick);
    }, 10);
  }
  function outsidePickerClick(e) {
    const picker = document.getElementById('vc-size-picker');
    if (picker && !picker.contains(e.target)) closeSizePicker();
  }
  function closeSizePicker() {
    const picker = document.getElementById('vc-size-picker');
    if (picker) picker.remove();
    document.removeEventListener('click', outsidePickerClick);
  }

  // ── INJECT CART HTML ─────────────────────────
  function injectCartHTML() {
    if (document.getElementById('vision-cart-sidebar')) return;
    const html = `
      <div id="vision-cart-overlay"></div>
      <div id="vision-cart-sidebar">
        <div class="vc-header">
          <div>
            <p class="vc-eyebrow">Your</p>
            <h2 class="vc-title">Cart</h2>
          </div>
          <button class="vc-close" id="vc-close">✕</button>
        </div>
        <div class="vc-items" id="vc-items"></div>
        <div class="vc-footer" id="vc-footer"></div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('vc-close').addEventListener('click', closeCart);
    document.getElementById('vision-cart-overlay').addEventListener('click', closeCart);
  }

  // ── INJECT CSS ───────────────────────────────
  function injectCartCSS() {
    if (document.getElementById('vision-cart-css')) return;
    const css = `
      #vision-cart-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0); z-index: 1000;
        pointer-events: none; transition: background .35s;
      }
      #vision-cart-overlay.open {
        background: rgba(0,0,0,.7); pointer-events: all; backdrop-filter: blur(4px);
      }
      #vision-cart-sidebar {
        position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 95vw;
        background: #0c0c0c; border-left: 1px solid #1c1c1c;
        z-index: 1001; display: flex; flex-direction: column;
        transform: translateX(100%); transition: transform .4s cubic-bezier(.23,1,.32,1);
      }
      #vision-cart-sidebar.open { transform: translateX(0); }
      .vc-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 36px 32px 24px; border-bottom: 1px solid #1c1c1c;
      }
      .vc-eyebrow {
        font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-style: italic;
        font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #555; margin-bottom: 2px;
      }
      .vc-title {
        font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-style: italic;
        font-size: 48px; text-transform: uppercase; line-height: .9; color: white;
      }
      .vc-close {
        background: none; border: none; color: #555; font-size: 18px; cursor: none;
        transition: color .2s; padding: 4px; margin-top: 8px;
      }
      .vc-close:hover { color: white; }
      .vc-items { flex: 1; overflow-y: auto; padding: 24px 32px; }
      .vc-items::-webkit-scrollbar { width: 2px; }
      .vc-items::-webkit-scrollbar-thumb { background: #2a2a2a; }
      .vc-empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        height: 100%; text-align: center; gap: 12px;
      }
      .vc-empty-icon {
        width: 64px; height: 64px; background-image: url('visnobic.png');
        background-size: contain; background-repeat: no-repeat; opacity: .08; margin-bottom: 8px;
      }
      .vc-empty-title {
        font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-style: italic;
        font-size: 28px; text-transform: uppercase; color: #2a2a2a;
      }
      .vc-empty-sub { font-size: 12px; color: #2a2a2a; letter-spacing: 1px; }
      .vc-item {
        display: flex; gap: 16px; padding: 20px 0; border-bottom: 1px solid #161616;
        animation: vcSlideIn .3s ease forwards;
      }
      .vc-item-thumb {
        width: 72px; height: 88px; background: #141414; border-radius: 4px;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        border: 1px solid #1c1c1c;
      }
      .vc-thumb-tee { width: 32px; height: 36px; position: relative; }
      .vc-thumb-tee::before { content:''; position:absolute; bottom:0; left:4px; width:24px; height:28px; background:rgba(255,255,255,.08); border-radius:2px 2px 4px 4px; }
      .vc-thumb-tee::after { content:''; position:absolute; top:0; left:0; width:32px; height:12px; background:rgba(255,255,255,.08); clip-path:polygon(8px 0,24px 0,28px 6px,32px 6px,32px 12px,24px 12px,24px 6px,8px 6px,8px 12px,0 12px,0 6px,4px 6px); }
      .vc-thumb-hoodie { width: 34px; height: 40px; position: relative; }
      .vc-thumb-hoodie::before { content:''; position:absolute; bottom:0; left:3px; width:28px; height:32px; background:rgba(255,255,255,.08); border-radius:2px 2px 4px 4px; }
      .vc-thumb-hoodie::after { content:''; position:absolute; top:0; left:0; width:34px; height:14px; background:rgba(255,255,255,.08); clip-path:polygon(7px 0,27px 0,34px 8px,34px 14px,27px 14px,27px 8px,7px 8px,7px 14px,0 14px,0 8px); }
      .vc-thumb-generic { width: 28px; height: 28px; background: rgba(255,255,255,.06); border-radius: 50%; }
      .vc-item-info { flex: 1; min-width: 0; }
      .vc-item-type { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic; font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#444; margin-bottom:4px; }
      .vc-item-name { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-style:italic; font-size:17px; text-transform:uppercase; color:white; line-height:1.1; margin-bottom:6px; }
      .vc-item-size { font-size:11px; color:#444; letter-spacing:1px; margin-bottom:12px; }
      .vc-item-controls { display:flex; align-items:center; justify-content:space-between; }
      .vc-qty { display:flex; align-items:center; gap:12px; }
      .vc-qty-btn { background:none; border:1px solid #222; color:#666; width:26px; height:26px; border-radius:4px; font-size:14px; cursor:none; transition:all .2s; display:flex; align-items:center; justify-content:center; }
      .vc-qty-btn:hover { border-color:white; color:white; }
      .vc-qty-num { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:15px; color:white; min-width:16px; text-align:center; }
      .vc-item-price { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:16px; color:white; }
      .vc-remove { background:none; border:none; color:#333; font-size:12px; cursor:none; transition:color .2s; margin-left:8px; }
      .vc-remove:hover { color:#888; }
      .vc-footer { padding: 24px 32px 36px; border-top: 1px solid #1c1c1c; }
      .vc-subtotal { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:20px; }
      .vc-subtotal-label { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#555; }
      .vc-subtotal-amt { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-style:italic; font-size:32px; color:white; }
      .vc-checkout-btn {
        display:block; width:100%; padding:18px; background:white; color:black;
        font-family:'Barlow Condensed',sans-serif; font-weight:900; font-style:italic;
        font-size:15px; letter-spacing:3px; text-transform:uppercase; border:2px solid white;
        border-radius:999px; cursor:none; transition:all .3s; text-align:center; margin-bottom:12px;
      }
      .vc-checkout-btn:hover { background:transparent; color:white; }
      .vc-continue-btn {
        display:block; width:100%; padding:14px; background:transparent; color:#444;
        font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic;
        font-size:13px; letter-spacing:3px; text-transform:uppercase; border:1px solid #1c1c1c;
        border-radius:999px; cursor:none; transition:all .3s; text-align:center;
      }
      .vc-continue-btn:hover { border-color:#444; color:#888; }
      .vc-count-badge {
        position:absolute; top:-6px; right:-8px; background:white; color:black;
        font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:10px;
        width:18px; height:18px; border-radius:50%; display:flex; align-items:center;
        justify-content:center; opacity:0; transform:scale(0);
        transition: opacity .2s, transform .3s cubic-bezier(.34,1.56,.64,1);
      }
      .vc-count-badge.show { opacity:1; transform:scale(1); }
      .nav-cart { position:relative !important; }

      /* SIZE PICKER */
      #vc-size-picker {
        position: absolute; background: #111; border: 1px solid #2a2a2a;
        border-radius: 8px; padding: 16px 18px; z-index: 2000;
        opacity: 0; transform: translateY(6px);
        transition: opacity .2s, transform .2s cubic-bezier(.23,1,.32,1);
        min-width: 200px;
      }
      #vc-size-picker.open { opacity: 1; transform: translateY(0); }
      .vsp-label {
        font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic;
        font-size:10px; letter-spacing:4px; text-transform:uppercase; color:#555; margin-bottom:12px;
      }
      .vsp-sizes { display: flex; gap: 8px; flex-wrap: wrap; }
      .vsp-btn {
        background: none; border: 1px solid #2a2a2a; color: #888;
        font-family:'Barlow Condensed',sans-serif; font-weight:700; font-style:italic;
        font-size:13px; letter-spacing:1px; text-transform:uppercase;
        padding: 8px 14px; border-radius: 4px; cursor: none; transition: all .15s;
      }
      .vsp-btn:hover { border-color: white; color: white; background: rgba(255,255,255,.05); }

      @keyframes vcSlideIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
      @keyframes vcBump { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
    `;
    const style = document.createElement('style');
    style.id = 'vision-cart-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── RENDER CART ──────────────────────────────
  function renderCart() {
    const cart = getCart();
    const itemsEl = document.getElementById('vc-items');
    const footerEl = document.getElementById('vc-footer');
    if (!itemsEl) return;

    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.nav-cart').forEach(el => {
      el.querySelector('.vc-cart-num') 
        ? el.querySelector('.vc-cart-num').textContent = total
        : null;
    });
    const badge = document.querySelector('.vc-count-badge');
    if (badge) { badge.textContent = total; badge.classList.toggle('show', total > 0); }

    if (cart.length === 0) {
      itemsEl.innerHTML = `
        <div class="vc-empty">
          <div class="vc-empty-icon"></div>
          <p class="vc-empty-title">Nothing Here</p>
          <p class="vc-empty-sub">Add something to get started</p>
        </div>`;
      footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = cart.map(item => {
      const isHoodie = /hoodie|crewneck/i.test(item.type);
      const thumbShape = isHoodie ? 'vc-thumb-hoodie' : (/(tee|shirt)/i.test(item.type) ? 'vc-thumb-tee' : 'vc-thumb-generic');
      return `
        <div class="vc-item">
          <div class="vc-item-thumb"><div class="${thumbShape}"></div></div>
          <div class="vc-item-info">
            <p class="vc-item-type">${item.type}</p>
            <p class="vc-item-name">${item.name}</p>
            <p class="vc-item-size">Size: ${item.size}</p>
            <div class="vc-item-controls">
              <div class="vc-qty">
                <button class="vc-qty-btn" onclick="window.__visionCart.updateQty('${item.key}',-1)">−</button>
                <span class="vc-qty-num">${item.qty}</span>
                <button class="vc-qty-btn" onclick="window.__visionCart.updateQty('${item.key}',1)">+</button>
              </div>
              <div style="display:flex;align-items:center;">
                <span class="vc-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                <button class="vc-remove" onclick="window.__visionCart.removeFromCart('${item.key}')">✕</button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    footerEl.innerHTML = `
      <div class="vc-subtotal">
        <span class="vc-subtotal-label">Subtotal</span>
        <span class="vc-subtotal-amt">$${subtotal.toFixed(2)}</span>
      </div>
      <button class="vc-checkout-btn">Checkout</button>
      <button class="vc-continue-btn" onclick="window.__visionCart.closeCart()">Continue Shopping</button>
    `;
  }

  // ── OPEN / CLOSE ─────────────────────────────
  function openCart() {
    document.getElementById('vision-cart-sidebar').classList.add('open');
    document.getElementById('vision-cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    document.getElementById('vision-cart-sidebar').classList.remove('open');
    document.getElementById('vision-cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }
  function animateCartBump() {
    const badge = document.querySelector('.vc-count-badge');
    if (badge) { badge.style.animation='none'; setTimeout(()=>{ badge.style.animation='vcBump .3s ease'; },10); }
  }

  // ── WIRE NAV CART ─────────────────────────────
  function wireNavCart() {
    document.querySelectorAll('.nav-cart').forEach(el => {
      if (!el.querySelector('.vc-count-badge')) {
        el.style.position = 'relative';
        const num = el.textContent.match(/\d+/)?.[0] || '0';
        el.innerHTML = `Cart (<span class="vc-cart-num">${num}</span>)<span class="vc-count-badge">0</span>`;
      }
      el.addEventListener('click', openCart);
    });
  }

  // ── WIRE ADD BUTTONS ──────────────────────────
  function wireAddButtons() {
    // index.html simple "Add to Cart" buttons (no data-product)
    document.querySelectorAll('.product-hover-add:not([data-product]):not([data-wired])').forEach(btn => {
      btn.dataset.wired = '1';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.product-card');
        const name = card.querySelector('.product-name')?.textContent || 'Product';
        const price = card.querySelector('.product-price')?.textContent || '$0';
        const type = card.querySelector('.product-type')?.textContent || 'Item';
        openSizePicker(name, price, type, btn);
      });
    });

    // shop.html Quick View add button
    const qvAddBtn = document.getElementById('qv-add-btn');
    if (qvAddBtn && !qvAddBtn.dataset.wired) {
      qvAddBtn.dataset.wired = '1';
      qvAddBtn.addEventListener('click', () => {
        const name = document.getElementById('qv-name')?.textContent;
        const price = document.getElementById('qv-price')?.textContent;
        const type = document.getElementById('qv-type')?.textContent;
        const selectedSize = document.querySelector('.size-pill.selected')?.textContent || 'OS';
        addToCart(name, price, type, selectedSize);
        document.getElementById('qv-overlay')?.classList.remove('open');
      });
    }
  }

  // ── INIT ──────────────────────────────────────
  function init() {
    injectCartCSS();
    injectCartHTML();
    wireNavCart();
    wireAddButtons();
    renderCart();
  }

  window.__visionCart = { addToCart, removeFromCart, updateQty, openCart, closeCart };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

})();
