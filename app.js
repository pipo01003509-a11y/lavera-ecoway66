// ============== إعدادات عامة ==============
const STORE_WHATSAPP = "201097753110";
const CAT_LABELS = {
  CLOTHS: "فوط ومايكروفايبر",
  TOOLS: "أدوات وأجهزة تنظيف",
  CHEM: "منظفات ومساحيق Eco Touch",
  BEAUTY: "العناية الشخصية",
  SOAP: "صابون Coco Lab الطبيعي",
  PERFUME: "عطور Ecoway"
};

let currentCategory = 'ALL';
let products = JSON.parse(localStorage.getItem('lavera_ecoway_catalog_v2')) || JSON.parse(JSON.stringify(CATALOG_PRODUCTS));
let cart = JSON.parse(localStorage.getItem('lavera_ecoway_cart_v2')) || [];
let adminPassword = localStorage.getItem('lavera_admin_pass_v2') || '1234';
let isAdminLoggedIn = false;

function persistProducts() {
  localStorage.setItem('lavera_ecoway_catalog_v2', JSON.stringify(products));
}
function persistCart() {
  localStorage.setItem('lavera_ecoway_cart_v2', JSON.stringify(cart));
}

// ============== التصفية والعرض ==============
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.remove('bg-slate-900', 'text-amber-400');
    b.classList.add('bg-white', 'text-slate-700');
  });
  const target = btn || (window.event && window.event.target);
  if (target) {
    target.classList.remove('bg-white', 'text-slate-700');
    target.classList.add('bg-slate-900', 'text-amber-400');
  }
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById('products-container');

  let filtered = products;
  if (currentCategory !== 'ALL') {
    filtered = products.filter(p => p.cat === currentCategory);
  }

  document.getElementById('products-count').innerText = `${filtered.length} منتج`;
  document.getElementById('section-title').querySelector('span').innerText =
    currentCategory === 'ALL' ? 'جميع المنتجات المعروضة' : (CAT_LABELS[currentCategory] || 'المنتجات');

  container.innerHTML = filtered.map(prod => {
    const src = prod.img || '';
    return `
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between">
      ${src ? `<img src="${src}" loading="lazy" class="prod-img w-full" alt="${prod.title}" onerror="this.style.display='none'">` : ''}
      <div class="p-5 flex flex-col flex-grow justify-between">
        <div>
          <div class="flex justify-between items-center mb-2 gap-2">
            <span class="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
              ${CAT_LABELS[prod.cat] || 'إيكواي'}
            </span>
            ${prod.badge ? `
              <span class="text-[11px] font-extrabold bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
                ${prod.badge}
              </span>` : ''}
          </div>

          <h3 class="text-lg font-black text-slate-900 mb-1">${prod.title}</h3>
          ${prod.subtitle ? `<p class="text-xs text-slate-500 mb-3">${prod.subtitle}</p>` : ''}

          <div class="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-list-check text-amber-600"></i> التفاصيل والمميزات:
            </h4>
            <ul class="space-y-1.5 text-sm text-slate-700">
              ${(prod.items||[]).map(item => `
                <li class="flex items-start gap-2">
                  <i class="fa-solid fa-circle-check text-emerald-500 text-xs mt-1"></i>
                  <span>${item}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ${prod.size ? `<p class="text-xs text-slate-500 mb-3"><i class="fa-solid fa-ruler-combined ml-1 text-amber-600"></i> ${prod.size}</p>` : ''}
        </div>

        <div>
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-2xl font-black text-slate-900">${prod.price} <span class="text-sm font-bold text-emerald-700">ج.م</span></span>
          </div>

          <div class="space-y-2">
            <button onclick="addToCart(${prod.id})" class="w-full bg-slate-900 hover:bg-black active:scale-95 text-amber-300 font-bold py-3 rounded-2xl transition flex items-center justify-center gap-2 shadow-md">
              <i class="fa-solid fa-cart-plus"></i>
              <span>إضافة إلى السلة</span>
            </button>

            ${isAdminLoggedIn ? `
              <div class="flex gap-2 pt-1">
                <button onclick="startEditProduct(${prod.id})" class="flex-1 bg-amber-100 text-amber-900 border border-amber-300 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-200 transition">
                  <i class="fa-solid fa-pen-to-square"></i> تعديل
                </button>
                <button onclick="deleteProduct(${prod.id})" class="flex-1 bg-rose-50 text-rose-600 border border-rose-200 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-100 transition">
                  <i class="fa-solid fa-trash"></i> حذف
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

// ============== السلة ==============
function addToCart(id) {
  const prod = products.find(p => p.id === id);
  const cartItem = cart.find(c => c.id === id);

  if (cartItem) {
    cartItem.qty += 1;
  } else {
    cart.push({ ...prod, qty: 1 });
  }

  persistCart();
  updateCartUI();
  toggleCartDrawer(true);
}

function updateCartItemQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  persistCart();
  updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  document.getElementById('cart-counter').innerText = totalCount;
  document.getElementById('cart-total-price').innerText = `${totalPrice} ج.م`;

  const container = document.getElementById('cart-items-list');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i class="fa-solid fa-basket-shopping text-4xl mb-3 text-slate-300"></i>
        <p class="text-sm font-semibold">سلة المشتريات فارغة</p>
      </div>
    `;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div>
          <h5 class="text-sm font-bold text-slate-800">${item.title}</h5>
          <p class="text-xs text-emerald-700 font-bold">${item.price} ج.م × ${item.qty}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateCartItemQty(${item.id}, -1)" class="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold">-</button>
          <span class="text-sm font-bold text-slate-800 px-1">${item.qty}</span>
          <button onclick="updateCartItemQty(${item.id}, 1)" class="w-7 h-7 bg-white border border-slate-200 rounded-lg font-bold">+</button>
        </div>
      </div>
    `).join('');
  }
}

function toggleCartDrawer(forceOpen = false) {
  const drawer = document.getElementById('cart-drawer');
  if (forceOpen) {
    drawer.classList.remove('hidden');
  } else {
    drawer.classList.toggle('hidden');
  }
}

function completeOrderWhatsApp() {
  if (cart.length === 0) {
    alert('السلة فارغة!');
    return;
  }

  const name = document.getElementById('order-name').value.trim();
  const phone = document.getElementById('order-phone').value.trim();
  const address = document.getElementById('order-address').value.trim();

  if (!name || !phone || !address) {
    alert('يرجى ملء جميع بيانات الشحن');
    return;
  }

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  let msg = `✨ *طلب شراء جديد عبر متجر LAVÉRA* ✨\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *العميل:* ${name}\n`;
  msg += `📱 *الهاتف:* ${phone}\n`;
  msg += `📍 *العنوان:* ${address}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *المنتجات المطلوبة:*\n`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.title} (عدد: ${item.qty}) = ${item.price * item.qty} ج.م\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *المجموع الإجمالي:* ${totalPrice} جنيه مصري\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `يرجى تأكيد موعد الشحن والتوصيل.`;

  window.open(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

  cart = [];
  persistCart();
  updateCartUI();
  document.getElementById('order-name').value = '';
  document.getElementById('order-phone').value = '';
  document.getElementById('order-address').value = '';
}

// ============== لوحة الإدارة ==============
function openAdminModal() {
  document.getElementById('admin-modal').classList.remove('hidden');
}
function closeAdminModal() {
  document.getElementById('admin-modal').classList.add('hidden');
}

function authenticateAdmin() {
  const pass = document.getElementById('admin-pass-input').value;
  if (pass === adminPassword) {
    isAdminLoggedIn = true;
    document.getElementById('admin-login-view').classList.add('hidden');
    document.getElementById('admin-panel-view').classList.remove('hidden');
    renderProducts();
  } else {
    alert('كلمة المرور غير صحيحة!');
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  document.getElementById('admin-pass-input').value = '';
  document.getElementById('admin-panel-view').classList.add('hidden');
  document.getElementById('admin-login-view').classList.remove('hidden');
  closeAdminModal();
  renderProducts();
}

function startEditProduct(id) {
  const prod = products.find(p => p.id === id);
  if (!prod) return;

  openAdminModal();
  document.getElementById('edit-prod-id').value = prod.id;
  document.getElementById('adm-title').value = prod.title;
  document.getElementById('adm-sub').value = prod.subtitle || '';
  document.getElementById('adm-cat').value = prod.cat || 'CLOTHS';
  document.getElementById('adm-price').value = prod.price;
  document.getElementById('adm-size').value = prod.size || '';
  document.getElementById('adm-badge').value = prod.badge || '';
  document.getElementById('adm-img').value = prod.img || '';
  document.getElementById('adm-items').value = (prod.items||[]).join('\n');

  document.getElementById('admin-form-title').innerText = `✏️ تعديل: ${prod.title}`;
  document.getElementById('admin-submit-btn').innerText = 'تحديث بيانات المنتج';
  document.getElementById('admin-cancel-btn').classList.remove('hidden');
}

function cancelEditMode() {
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('adm-title').value = '';
  document.getElementById('adm-sub').value = '';
  document.getElementById('adm-price').value = '';
  document.getElementById('adm-size').value = '';
  document.getElementById('adm-badge').value = '';
  document.getElementById('adm-img').value = '';
  document.getElementById('adm-items').value = '';

  document.getElementById('admin-form-title').innerText = '➕ إضافة منتج أو باقة جديدة:';
  document.getElementById('admin-submit-btn').innerText = 'حفظ التعديلات';
  document.getElementById('admin-cancel-btn').classList.add('hidden');
}

function saveOrUpdateProduct() {
  const editId = document.getElementById('edit-prod-id').value;
  const title = document.getElementById('adm-title').value.trim();
  const subtitle = document.getElementById('adm-sub').value.trim();
  const cat = document.getElementById('adm-cat').value;
  const price = parseFloat(document.getElementById('adm-price').value);
  const size = document.getElementById('adm-size').value.trim();
  const badge = document.getElementById('adm-badge').value.trim();
  const img = document.getElementById('adm-img').value.trim();
  const itemsRaw = document.getElementById('adm-items').value.trim();

  if (!title || isNaN(price) || !itemsRaw) {
    alert('يرجى ملء الاسم والسعر والتفاصيل');
    return;
  }

  const items = itemsRaw.split(/[\n,]/).map(i => i.trim()).filter(i => i.length > 0);

  if (editId) {
    const index = products.findIndex(p => p.id == editId);
    if (index !== -1) {
      products[index] = { ...products[index], title, subtitle, cat, price, size, badge, items, img: img || products[index].img };
      alert('تم تحديث المنتج بنجاح!');
    }
  } else {
    products.push({
      id: Date.now(),
      title, subtitle, cat, price, size, badge, items, img: img || ''
    });
    alert('تمت إضافة المنتج بنجاح!');
  }

  persistProducts();
  renderProducts();
  cancelEditMode();
  closeAdminModal();
}

function deleteProduct(id) {
  if (confirm('هل أنت متأكد من حذف هذا المنتج من المتجر؟')) {
    products = products.filter(p => p.id !== id);
    persistProducts();
    renderProducts();
  }
}

function changeAdminPassword() {
  const newPass = document.getElementById('new-admin-pass').value.trim();
  if (!newPass) {
    alert('يرجى كتابة كلمة سر صالحة');
    return;
  }
  adminPassword = newPass;
  localStorage.setItem('lavera_admin_pass_v2', newPass);
  document.getElementById('new-admin-pass').value = '';
  alert('تم تحديث كلمة السر بنجاح!');
}

function resetToDefaultData() {
  if (confirm('هل تريد استعادة جميع منتجات الكتالوج الأصلية؟')) {
    products = JSON.parse(JSON.stringify(CATALOG_PRODUCTS));
    persistProducts();
    renderProducts();
    alert('تمت استعادة الكتالوج بالكامل.');
  }
}

// ============== بدء التشغيل ==============
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
});
