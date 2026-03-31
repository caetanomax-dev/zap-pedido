/**
 * ============================================================
 * APP.JS — ZapPedido
 * ============================================================
 */

// ─── ESTADO GLOBAL ────────────────────────────────────────────
const cart = {};
let pendingWhatsappUrl = null;

// Número do pedido sequencial, salvo no navegador
function getNextOrderNumber() {
  const current = parseInt(localStorage.getItem("zp_order_number") || "0");
  const next = current + 1;
  localStorage.setItem("zp_order_number", next);
  return String(next).padStart(4, "0"); // 0001, 0042, 0100...
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Carrega cardápio do localStorage se cliente já editou pelo painel
  const savedMenu = localStorage.getItem("zp_menu_data");
  if (savedMenu) {
    try { CONFIG.menu = JSON.parse(savedMenu); } catch(e) {}
  }

  // Carrega taxas de entrega do localStorage se admin já editou
  const savedDelivery = localStorage.getItem("zp_delivery_data");
  if (savedDelivery) {
    try { CONFIG.delivery = JSON.parse(savedDelivery); } catch(e) {}
  }

  applyConfig();
  renderCategories();
  renderProducts();
  setupEventListeners();
});

function applyConfig() {
  document.title = CONFIG.store.name;
  document.getElementById("page-title").textContent  = CONFIG.store.name;
  document.getElementById("store-name").textContent  = CONFIG.store.name;
  document.getElementById("store-tagline").textContent = CONFIG.store.tagline || "";

  // Logo — suporta emoji ou URL de imagem
  const logoEl = document.getElementById("store-logo");
  const logo   = CONFIG.store.logo || "🛍️";
  if (logo.startsWith("http") || logo.endsWith(".png") || logo.endsWith(".jpg") || logo.endsWith(".svg") || logo.endsWith(".webp")) {
    logoEl.innerHTML = `<img src="${logo}" alt="Logo" style="width:28px;height:28px;border-radius:6px;object-fit:cover"/>`;
  } else {
    logoEl.textContent = logo;
  }

  // Cores da aparência (novo objeto appearance)
  const ap   = CONFIG.appearance || {};
  const root = document.documentElement;
  if (ap.primaryColor) {
    root.style.setProperty("--green",    ap.primaryColor);
    root.style.setProperty("--green-dk", ap.accentColor  || ap.primaryColor);
    root.style.setProperty("--green-lt", ap.primaryColor + "18");
    root.style.setProperty("--green-bd", ap.primaryColor + "40");
  }
  if (ap.headerColor)  root.style.setProperty("--sidebar-bg", ap.headerColor);
  if (ap.fontColor)    root.style.setProperty("--ink", ap.fontColor);

  // Suporte legado ao objeto ui
  if (CONFIG.ui) {
    if (CONFIG.ui.primaryColor) root.style.setProperty("--green",      CONFIG.ui.primaryColor);
    if (CONFIG.ui.accentColor)  root.style.setProperty("--green-dk",   CONFIG.ui.accentColor);
    if (CONFIG.ui.headerBg)     root.style.setProperty("--ink",        CONFIG.ui.headerBg);
  }
}

// ─── RENDERIZAÇÃO DO CARDÁPIO ─────────────────────────────────

function renderCategories() {
  const nav = document.getElementById("categories-nav");
  nav.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "cat-btn";
  allBtn.textContent = "🔍 Todos";
  allBtn.dataset.category = "all";
  allBtn.addEventListener("click", () => filterByCategory("all", allBtn));
  nav.appendChild(allBtn);

  CONFIG.menu.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (index === 0 ? " active" : "");
    btn.textContent = cat.category;
    btn.dataset.category = cat.category;
    btn.addEventListener("click", () => filterByCategory(cat.category, btn));
    nav.appendChild(btn);
  });
}

function renderProducts(filterCat = null) {
  const container = document.getElementById("products-list");
  container.innerHTML = "";
  CONFIG.menu.forEach((cat) => {
    if (filterCat && filterCat !== "all" && filterCat !== cat.category) return;
    const visibleItems = cat.items.filter(item => item.active !== false);
    if (visibleItems.length === 0) return;
    const section = document.createElement("div");
    section.className = "product-category";
    const heading = document.createElement("h2");
    heading.className = "category-title";
    heading.textContent = cat.category;
    section.appendChild(heading);
    const grid = document.createElement("div");
    grid.className = "product-grid";
    visibleItems.forEach(item => grid.appendChild(createProductCard(item)));
    section.appendChild(grid);
    container.appendChild(section);
  });
}

function createProductCard(item) {
  const inStock = item.stock !== false;
  const hasImg  = item.image && item.image.trim() !== "";

  const card = document.createElement("div");
  card.className = "product-card" + (inStock ? "" : " out-of-stock") + (hasImg ? " has-image" : "");
  card.id = `card-${item.id}`;

  card.innerHTML = `
    ${hasImg ? `<div class="product-img-wrap"><img src="${item.image}" alt="${item.name}" class="product-img" loading="lazy"/>${!inStock ? '<div class="product-img-overlay">Indisponível</div>' : ''}</div>` : ""}
    <div class="product-info">
      <h3 class="product-name">${item.name}</h3>
      <p class="product-desc">${item.description || ""}</p>
      <span class="product-price">${formatCurrency(item.price)}</span>
    </div>
    <div class="product-controls">
      ${inStock ? `
        <div class="qty-control" id="qty-${item.id}" style="display:none">
          <button class="qty-btn minus" data-id="${item.id}" aria-label="Remover">−</button>
          <span class="qty-value" id="qval-${item.id}">0</span>
          <button class="qty-btn plus" data-id="${item.id}" aria-label="Adicionar">+</button>
        </div>
        <button class="btn-add" id="add-${item.id}" data-id="${item.id}" aria-label="Adicionar">Adicionar</button>
      ` : `<span class="badge-unavailable">Indisponível</span>`}
    </div>`;

  if (inStock) {
    card.querySelector(".btn-add").addEventListener("click", () => addToCart(item));
    card.querySelector(".qty-btn.plus").addEventListener("click", () => addToCart(item));
    card.querySelector(".qty-btn.minus").addEventListener("click", () => removeFromCart(item.id));
  }
  return card;
}

function filterByCategory(cat, clickedBtn) {
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  clickedBtn.classList.add("active");
  renderProducts(cat === "all" ? null : cat);
  Object.values(cart).forEach(({ item, quantity }) => updateCardUI(item.id, quantity));
}

// ─── CARRINHO ─────────────────────────────────────────────────

function addToCart(item) {
  if (item.stock === false) { showToast("⚠️ Este produto está indisponível."); return; }
  if (!cart[item.id]) cart[item.id] = { item, quantity: 0 };
  cart[item.id].quantity++;
  updateCardUI(item.id, cart[item.id].quantity);
  updateCartPanel();
  showToast(`✅ ${item.name} adicionado!`);
}

function removeFromCart(id) {
  if (!cart[id]) return;
  cart[id].quantity--;
  if (cart[id].quantity <= 0) { delete cart[id]; updateCardUI(id, 0); }
  else updateCardUI(id, cart[id].quantity);
  updateCartPanel();
}

function updateCardUI(id, quantity) {
  const addBtn  = document.getElementById(`add-${id}`);
  const qtyCtrl = document.getElementById(`qty-${id}`);
  const qtyVal  = document.getElementById(`qval-${id}`);
  if (!addBtn || !qtyCtrl) return;
  if (quantity > 0) {
    addBtn.style.display = "none"; qtyCtrl.style.display = "flex";
    qtyVal.textContent = quantity;
  } else {
    addBtn.style.display = ""; qtyCtrl.style.display = "none";
    if (qtyVal) qtyVal.textContent = "0";
  }
}

function updateCartPanel() {
  const itemsContainer = document.getElementById("cart-items");
  const orderForm      = document.getElementById("order-form");
  const cpanelTotal    = document.getElementById("cpanel-total");
  const cpanelFoot     = document.getElementById("cpanel-foot");
  const badge          = document.getElementById("cart-badge");
  const totalEl        = document.getElementById("cart-total-value");
  const cartItems      = Object.values(cart);

  const totalQty = cartItems.reduce((s, e) => s + e.quantity, 0);
  badge.textContent = totalQty;
  badge.style.display = totalQty > 0 ? "flex" : "none";

  if (cartItems.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon">🛍️</div>
        <p>Seu carrinho está vazio</p>
        <span>Adicione produtos para começar</span>
      </div>`;
    orderForm.style.display = cpanelTotal.style.display = cpanelFoot.style.display = "none";
    return;
  }

  itemsContainer.innerHTML = cartItems.map(({ item, quantity }) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${formatCurrency(item.price * quantity)}</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn minus" onclick="removeFromCart(${item.id})" aria-label="Remover">−</button>
        <span class="qty-value">${quantity}</span>
        <button class="qty-btn plus" onclick="addToCart(${JSON.stringify(item).replace(/"/g, "&quot;")})" aria-label="Adicionar">+</button>
      </div>
    </div>`).join("");

  const total    = cartItems.reduce((s, { item, quantity }) => s + item.price * quantity, 0);
  const { fee, zone } = getDeliveryFee();
  const grandTotal    = fee !== null ? total + fee : total;

  // Monta linha de subtotal + taxa se aplicável
  let totalHtml = "";
  if (fee !== null && fee > 0) {
    totalHtml = `
      <div class="cpanel-subtotal">
        <span class="cpanel-subtotal-label">Subtotal</span>
        <span class="cpanel-subtotal-value">${formatCurrency(total)}</span>
      </div>
      <div class="cpanel-subtotal cpanel-fee">
        <span class="cpanel-subtotal-label">🛵 Entrega${zone ? ` · ${zone}` : ""}</span>
        <span class="cpanel-subtotal-value">${fee === 0 ? "Grátis" : formatCurrency(fee)}</span>
      </div>`;
  } else if (fee === null && zone) {
    totalHtml = `
      <div class="cpanel-delivery-warn">
        ⚠️ Não entregamos em <strong>${zone}</strong>. Confirme o endereço.
      </div>`;
  } else if (fee === 0 && zone) {
    totalHtml = `
      <div class="cpanel-subtotal cpanel-fee">
        <span class="cpanel-subtotal-label">🛵 Entrega em ${zone}</span>
        <span class="cpanel-subtotal-value cpanel-fee-free">Grátis</span>
      </div>`;
  }

  totalEl.textContent = formatCurrency(grandTotal);

  // Injeta linhas de taxa antes do total no topo
  const feeEl = document.getElementById("cpanel-fee-lines");
  if (feeEl) feeEl.innerHTML = totalHtml;

  orderForm.style.display   = "block";
  cpanelTotal.style.display = "flex";
  cpanelFoot.style.display  = "block";
}

// ─── DESBLOQUEIO PROGRESSIVO ──────────────────────────────────
// A seção de Pagamento só é desbloqueada quando o telefone está preenchido

function checkPaymentUnlock() {
  const phone     = document.getElementById("customer-phone").value.replace(/\D/g, "");
  const stepPay   = document.getElementById("step-payment");
  const lockOver  = document.getElementById("payment-lock");
  const content   = document.getElementById("payment-content");
  const unlocked  = phone.length >= 10; // mínimo DDD + 8 dígitos

  stepPay.classList.toggle("form-step--locked", !unlocked);
  lockOver.style.display  = unlocked ? "none"  : "flex";
  content.style.display   = unlocked ? "block" : "none";

  // Atualiza texto do overlay conforme o que falta
  if (!unlocked) {
    lockOver.querySelector("p").innerHTML = "Preencha seu <strong>telefone</strong> para liberar";
  }
}

// ─── VALIDAÇÃO ────────────────────────────────────────────────

function setFieldError(wrapEl, msg) {
  wrapEl.classList.add("has-error");
  let errEl = wrapEl.querySelector(".field-error-msg");
  if (!errEl) { errEl = document.createElement("p"); errEl.className = "field-error-msg"; wrapEl.appendChild(errEl); }
  errEl.innerHTML = `⚠️ ${typeof msg === "function" ? msg() : msg}`;
}

function clearFieldError(wrapEl) {
  wrapEl.classList.remove("has-error");
  wrapEl.querySelector(".field-error-msg")?.remove();
}

function clearAllErrors() {
  document.querySelectorAll(".field-wrap.has-error").forEach(clearFieldError);
}

function validate() {
  clearAllErrors();
  let firstWrap = null;

  const phone = document.getElementById("customer-phone").value.replace(/\D/g, "");
  if (phone.length < 10) {
    const wrap = document.getElementById("customer-phone").closest(".field-wrap");
    setFieldError(wrap, "Informe seu WhatsApp ou telefone para contato");
    firstWrap = firstWrap || wrap;
  }

  const paySelected = document.querySelector(".pay-btn.selected");
  if (!paySelected) {
    // Só mostra erro de pagamento se o telefone estiver ok (passo já desbloqueado)
    if (phone.length >= 10) {
      const wrap = document.querySelector(".pay-grid").closest(".field-wrap");
      setFieldError(wrap, "Selecione uma forma de pagamento");
      firstWrap = firstWrap || wrap;
    }
  } else if (paySelected.dataset.value === "dinheiro") {
    const total    = Object.values(cart).reduce((s, { item, quantity }) => s + item.price * quantity, 0);
    const changeEl = document.getElementById("customer-change");
    const val      = parseFloat(changeEl.value || "0");
    if (!val) {
      const wrap = changeEl.closest(".field-wrap");
      setFieldError(wrap, "Informe o valor que você vai entregar");
      firstWrap = firstWrap || wrap;
    } else if (val < total) {
      const wrap = changeEl.closest(".field-wrap");
      setFieldError(wrap, `Valor insuficiente — faltam ${formatCurrency(total - val)}`);
      firstWrap = firstWrap || wrap;
    }
  }

  if (firstWrap) {
    firstWrap.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const input = firstWrap.querySelector("input, button");
      input?.focus();
    }, 300);
    return false;
  }
  return true;
}

// ─── TAXA DE ENTREGA ──────────────────────────────────────────

// Retorna { fee: number|null, zone: string|null }
// fee: null = não entrega nessa região
// fee: 0    = grátis
function getDeliveryFee() {
  const delivery = CONFIG.delivery;
  if (!delivery || !delivery.enabled) return { fee: 0, zone: null };

  // Pega o bairro — do CEP ou do campo manual
  const isCepMode   = document.getElementById("address-cep-mode").style.display !== "none";
  const neighborhood = isCepMode
    ? document.getElementById("address-neighborhood").value.trim()
    : document.getElementById("customer-address").value.trim();

  if (!neighborhood) return { fee: 0, zone: null }; // sem endereço, não exibe

  // Busca zona correspondente (case-insensitive, partial match)
  const zones = delivery.zones || [];
  const match = zones.find(z =>
    neighborhood.toLowerCase().includes(z.neighborhood.toLowerCase()) ||
    z.neighborhood.toLowerCase().includes(neighborhood.toLowerCase())
  );

  if (match) return { fee: match.fee, zone: match.neighborhood };

  // Região não listada
  return { fee: delivery.defaultFee ?? null, zone: neighborhood };
}

// Retorna total dos itens do carrinho
function getItemsTotal() {
  return Object.values(cart).reduce((s, { item, quantity }) => s + item.price * quantity, 0);
}

// Retorna total final (itens + taxa)
function getGrandTotal() {
  const itemsTotal = getItemsTotal();
  const { fee }    = getDeliveryFee();
  return fee !== null ? itemsTotal + fee : itemsTotal;
}


function buildMessage(orderNumber) {
  const cartItems       = Object.values(cart);
  const customerName    = document.getElementById("customer-name").value.trim();
  const customerPhone   = document.getElementById("customer-phone").value.trim();
  const customerAddress = buildAddressString();
  const selectedPayBtn  = document.querySelector(".pay-btn.selected");
  const paymentMethod   = selectedPayBtn?.dataset.value || null;
  const changeInput     = document.getElementById("customer-change").value.trim();
  const itemsTotal      = getItemsTotal();
  const { fee, zone }   = getDeliveryFee();
  const grandTotal      = fee !== null ? itemsTotal + fee : itemsTotal;

  const itemLines = cartItems
    .map(({ item, quantity }) => `• ${item.name} x${quantity} — ${formatCurrency(item.price * quantity)}`)
    .join("\n");

  let msg = CONFIG.order.greeting + "\n\n";
  msg += `🧾 *Pedido:* ${orderNumber}\n`;
  if (customerName)    msg += `👤 *Nome:* ${customerName}\n`;
  if (customerPhone)   msg += `📱 *Telefone:* ${customerPhone}\n`;
  if (customerAddress) msg += `📍 *Endereço:* ${customerAddress}\n`;
  msg += "\n";
  msg += `📋 *Itens do Pedido:*\n${itemLines}\n\n`;

  // Taxa de entrega
  if (fee !== null && fee > 0 && zone) {
    msg += `🛵 *Entrega (${zone}):* ${formatCurrency(fee)}\n`;
  } else if (fee === 0 && zone) {
    msg += `🛵 *Entrega (${zone}):* Grátis\n`;
  }

  msg += `💰 *Total: ${formatCurrency(grandTotal)}*\n\n`;

  if (paymentMethod) {
    const labels = { pix: "Pix", credito: "Cartão de Crédito", debito: "Cartão de Débito", dinheiro: "Dinheiro" };
    msg += `💳 *Pagamento:* ${labels[paymentMethod]}\n`;
    if (paymentMethod === "dinheiro" && changeInput) {
      const changeValue = parseFloat(changeInput.replace(",", "."));
      if (!isNaN(changeValue) && changeValue >= grandTotal) {
        const troco = changeValue - grandTotal;
        msg += troco === 0
          ? `🔄 *Pagamento exato* — sem troco\n`
          : `🔄 *Troco para:* ${formatCurrency(changeValue)} _(troco: ${formatCurrency(troco)})_\n`;
      }
    }
    msg += "\n";
  }
  msg += CONFIG.order.footer;

  // Link de acompanhamento
  const baseUrl = window.location.href.replace("index.html","").replace(/\/$/, "");
  msg += `\n\n🔗 *Acompanhe seu pedido:*\n${baseUrl}/acompanhar.html?pedido=${orderNumber}`;

  return msg;
}

// ─── MODAL DE PRÉVIA ──────────────────────────────────────────

function openModal() {
  const cartItems       = Object.values(cart);
  const customerName    = document.getElementById("customer-name").value.trim();
  const customerPhone   = document.getElementById("customer-phone").value.trim();
  const customerAddress = buildAddressString();
  const selectedPayBtn  = document.querySelector(".pay-btn.selected");
  const paymentMethod   = selectedPayBtn?.dataset.value || null;
  const changeInput     = document.getElementById("customer-change").value.trim();
  const itemsTotal      = getItemsTotal();
  const { fee, zone }   = getDeliveryFee();
  const grandTotal      = fee !== null ? itemsTotal + fee : itemsTotal;
  const labels          = { pix: "💠 Pix", credito: "💳 Cartão de Crédito", debito: "🏦 Cartão de Débito", dinheiro: "💵 Dinheiro" };

  let trocoHtml = "";
  if (paymentMethod === "dinheiro" && changeInput) {
    const changeValue = parseFloat(changeInput.replace(",", "."));
    if (!isNaN(changeValue) && changeValue >= grandTotal) {
      const troco = changeValue - grandTotal;
      trocoHtml = troco === 0
        ? `<div class="preview-row"><span>Troco</span><strong>Valor exato</strong></div>`
        : `<div class="preview-row"><span>Troco para</span><strong>${formatCurrency(changeValue)} <em class="troco-val">(troco: ${formatCurrency(troco)})</em></strong></div>`;
    }
  }

  let feeHtml = "";
  if (fee !== null && fee > 0) {
    feeHtml = `<div class="preview-row"><span>🛵 Entrega${zone ? ` · ${zone}` : ""}</span><strong>${formatCurrency(fee)}</strong></div>`;
  } else if (fee === 0 && zone) {
    feeHtml = `<div class="preview-row"><span>🛵 Entrega · ${zone}</span><strong style="color:var(--green-dk)">Grátis</strong></div>`;
  }

  const previewNumber = String(parseInt(localStorage.getItem("zp_order_number") || "0") + 1).padStart(4, "0");

  document.getElementById("modal-body").innerHTML = `
    <div class="preview-section">
      <div class="preview-section-title">🧾 Pedido ${previewNumber}</div>
      ${cartItems.map(({ item, quantity }) => `
        <div class="preview-row">
          <span>${item.name} <em class="qty-tag">×${quantity}</em></span>
          <strong>${formatCurrency(item.price * quantity)}</strong>
        </div>`).join("")}
      ${feeHtml}
      <div class="preview-row preview-total">
        <span>Total</span>
        <strong>${formatCurrency(grandTotal)}</strong>
      </div>
    </div>
    <div class="preview-section">
      <div class="preview-section-title">👤 Dados</div>
      ${customerName    ? `<div class="preview-row"><span>Nome</span><strong>${customerName}</strong></div>` : ""}
      ${customerPhone   ? `<div class="preview-row"><span>Telefone</span><strong>${customerPhone}</strong></div>` : ""}
      ${customerAddress ? `<div class="preview-row"><span>Endereço</span><strong>${customerAddress}</strong></div>` : ""}
    </div>
    <div class="preview-section">
      <div class="preview-section-title">💳 Pagamento</div>
      <div class="preview-row">
        <span>Forma</span>
        <strong>${paymentMethod ? labels[paymentMethod] : "—"}</strong>
      </div>
      ${trocoHtml}
    </div>
    <p class="preview-note">Confira os dados antes de enviar. Após confirmar, o WhatsApp abrirá com o pedido pronto.</p>
  `;

  pendingWhatsappUrl = "PENDING";
  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("order-modal").classList.add("open");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("modal-confirm").focus(), 100);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("order-modal").classList.remove("open");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "true");
}

function confirmOrder() {
  closeModal();
  closeCart();

  // Captura dados antes de zerar
  const orderNumber   = getNextOrderNumber();
  const customerName  = document.getElementById("customer-name").value.trim();
  const customerPhone = document.getElementById("customer-phone").value.trim();
  const customerAddr  = buildAddressString();
  const cartItems     = Object.values(cart);
  const itemsTotal    = getItemsTotal();
  const { fee, zone } = getDeliveryFee();
  const deliveryFee   = fee !== null ? fee : 0;
  const grandTotal    = itemsTotal + deliveryFee;
  const selectedPay   = document.querySelector(".pay-btn.selected");
  const payMethod     = selectedPay?.dataset.value || null;
  const changeVal     = parseFloat(document.getElementById("customer-change").value || "0") || null;

  // Monta itens para salvar
  const itemsData = cartItems.map(({ item, quantity }) => ({
    id: item.id, name: item.name, price: item.price, quantity,
  }));

  // Salva no Supabase (assíncrono, não bloqueia o fluxo)
  const orderData = {
    order_number:     orderNumber,
    store_id:         "default",
    customer_name:    customerName  || null,
    customer_phone:   customerPhone || null,
    customer_address: customerAddr  || null,
    payment_method:   payMethod,
    payment_change:   changeVal,
    items:            itemsData,
    items_total:      itemsTotal,
    delivery_fee:     deliveryFee,
    grand_total:      grandTotal,
    status:           "received",
    status_history:   [],
  };

  if (typeof sb !== "undefined") {
    sb.insert("orders", orderData).catch(() => {});
  }

  // Monta mensagem WhatsApp com link de acompanhamento
  const msg = buildMessage(orderNumber);
  const whatsappUrl = `https://wa.me/${CONFIG.store.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  setTimeout(() => { window.location.href = whatsappUrl; }, 320);

  // Mostra tela de sucesso
  showSuccessScreen({ orderNumber, customerName, customerPhone, customerAddr, total: grandTotal });

  // Zera carrinho e formulário
  Object.keys(cart).forEach(id => { updateCardUI(id, 0); delete cart[id]; });
  document.getElementById("customer-name").value     = "";
  document.getElementById("customer-phone").value    = "";
  document.getElementById("customer-change").value   = "";
  document.getElementById("change-hint").textContent = "";
  document.getElementById("change-wrap").style.display = "none";
  document.getElementById("cep-input").value         = "";
  document.getElementById("cep-status").textContent  = "";
  document.getElementById("cep-result").style.display = "none";
  document.getElementById("customer-address").value  = "";
  document.querySelectorAll(".pay-btn").forEach(b => b.classList.remove("selected"));
  clearAllErrors();
  checkPaymentUnlock();
  updateCartPanel();
}

// ─── FINALIZAR (dispara validação → modal) ────────────────────

function finalizarPedido() {
  if (Object.values(cart).length === 0) { showToast("⚠️ Adicione itens ao carrinho primeiro!"); return; }
  if (!validate()) return;
  openModal();
}

// ─── EVENT LISTENERS ──────────────────────────────────────────

function setupEventListeners() {
  document.getElementById("cart-toggle").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("cart-overlay").addEventListener("click", closeCart);
  document.getElementById("btn-finalizar").addEventListener("click", finalizarPedido);
  document.getElementById("btn-new-order").addEventListener("click", hideSuccessScreen);

  // Modal
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-back").addEventListener("click", closeModal);
  document.getElementById("modal-confirm").addEventListener("click", confirmOrder);
  document.getElementById("modal-overlay").addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.getElementById("order-modal").classList.contains("open")) closeModal();
      else closeCart();
    }
  });

  // ── Telefone: máscara + desbloqueio do pagamento ──────────
  document.getElementById("customer-phone").addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    this.value = v;
    checkPaymentUnlock();
    // Limpa erro do campo ao digitar
    const wrap = this.closest(".field-wrap");
    if (wrap?.classList.contains("has-error")) clearFieldError(wrap);
  });

  // ── Navegação Enter entre campos ──────────────────────────
  const flowOrder = ["customer-name", "customer-phone", "cep-input", "customer-address", "address-number", "address-complement", "customer-change"];
  flowOrder.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      for (let i = idx + 1; i < flowOrder.length; i++) {
        const next = document.getElementById(flowOrder[i]);
        if (next && next.offsetParent !== null && !next.readOnly) { next.focus(); return; }
      }
      document.getElementById("btn-finalizar").click();
    });
  });

  // ── Limpa erros ao digitar ─────────────────────────────────
  document.getElementById("cpanel-body").addEventListener("input", (e) => {
    const wrap = e.target.closest(".field-wrap");
    if (wrap?.classList.contains("has-error")) clearFieldError(wrap);
  });

  // ── Modo de endereço ──────────────────────────────────────
  document.getElementById("btn-mode-cep").addEventListener("click", () => setAddressMode("cep"));
  document.getElementById("btn-mode-manual").addEventListener("click", () => setAddressMode("manual"));

  // ── Máscara CEP ───────────────────────────────────────────
  document.getElementById("cep-input").addEventListener("input", function () {
    let v = this.value.replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5);
    this.value = v;
  });
  document.getElementById("cep-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); buscarCEP(); }
  });
  document.getElementById("btn-cep-search").addEventListener("click", buscarCEP);

  // ── Pagamento ─────────────────────────────────────────────
  document.querySelectorAll(".pay-btn").forEach((btn, idx, btns) => {
    // Torna focalizável por Tab
    btn.setAttribute("tabindex", "0");

    btn.addEventListener("click", () => {
      const alreadySelected = btn.classList.contains("selected");
      document.querySelectorAll(".pay-btn").forEach(b => b.classList.remove("selected"));
      if (!alreadySelected) btn.classList.add("selected");

      const isDinheiro = !alreadySelected && btn.dataset.value === "dinheiro";
      const changeWrap = document.getElementById("change-wrap");
      changeWrap.style.display = isDinheiro ? "flex" : "none";

      if (isDinheiro) {
        setTimeout(() => document.getElementById("customer-change").focus(), 50);
      } else {
        document.getElementById("customer-change").value = "";
        document.getElementById("change-hint").textContent = "";
        clearFieldError(document.getElementById("change-wrap"));
        // Foca no botão finalizar após selecionar pagamento
        if (!alreadySelected) {
          setTimeout(() => document.getElementById("btn-finalizar").focus(), 60);
        }
      }

      const wrap = btn.closest(".field-wrap");
      if (wrap?.classList.contains("has-error")) clearFieldError(wrap);
    });

    // Navegação por setas e Enter/Espaço
    btn.addEventListener("keydown", (e) => {
      const total = btns.length;
      const cols  = 2; // grid 2x2

      if (e.key === "ArrowRight") {
        e.preventDefault();
        btns[(idx + 1) % total].focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        btns[(idx - 1 + total) % total].focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        btns[(idx + cols) % total].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        btns[(idx - cols + total) % total].focus();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
        // Se não for dinheiro, foca direto no botão finalizar
        setTimeout(() => {
          const isDinheiro = btn.classList.contains("selected") && btn.dataset.value === "dinheiro";
          if (!isDinheiro) {
            document.getElementById("btn-finalizar").focus();
          }
        }, 60);
      }
    });
  });

  // ── Troco em tempo real ───────────────────────────────────
  document.getElementById("customer-change").addEventListener("input", function () {
    const hint  = document.getElementById("change-hint");
    const total = Object.values(cart).reduce((s, { item, quantity }) => s + item.price * quantity, 0);
    const val   = parseFloat(this.value.replace(",", "."));
    if (isNaN(val) || this.value === "") { hint.textContent = ""; hint.className = "change-hint"; return; }
    if (val < total) {
      hint.textContent = `⚠️ Valor insuficiente (faltam ${formatCurrency(total - val)})`;
      hint.className = "change-hint change-hint--error";
    } else {
      const troco = val - total;
      hint.textContent = troco === 0 ? "✅ Valor exato, sem troco." : `✅ Troco: ${formatCurrency(troco)}`;
      hint.className = "change-hint change-hint--ok";
    }
  });
}

function openCart() {
  document.getElementById("cart-panel").classList.add("open");
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-overlay").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-panel").classList.remove("open");
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-overlay").setAttribute("aria-hidden", "true");
  if (!document.getElementById("order-modal").classList.contains("open"))
    document.body.style.overflow = "";
}

// ─── ENDEREÇO ─────────────────────────────────────────────────

function setAddressMode(mode) {
  const isCep = mode === "cep";
  document.getElementById("btn-mode-cep").classList.toggle("active", isCep);
  document.getElementById("btn-mode-manual").classList.toggle("active", !isCep);
  document.getElementById("address-cep-mode").style.display    = isCep ? "block" : "none";
  document.getElementById("address-manual-mode").style.display = isCep ? "none"  : "block";
}

async function buscarCEP() {
  const cepRaw = document.getElementById("cep-input").value.replace(/\D/g, "");
  const status = document.getElementById("cep-status");
  const result = document.getElementById("cep-result");
  const icon   = document.getElementById("cep-search-icon");

  if (cepRaw.length !== 8) {
    status.textContent = "⚠️ Digite um CEP com 8 dígitos.";
    status.className = "cep-status cep-status--error"; return;
  }
  icon.textContent = "⏳"; status.textContent = "Buscando..."; status.className = "cep-status";
  result.style.display = "none";

  try {
    const res  = await fetch(`https://viacep.com.br/ws/${cepRaw}/json/`);
    const data = await res.json();
    if (data.erro) {
      status.textContent = "❌ CEP não encontrado. Verifique e tente novamente.";
      status.className = "cep-status cep-status--error"; icon.textContent = "→"; return;
    }
    document.getElementById("address-street").value       = data.logradouro || "";
    document.getElementById("address-neighborhood").value = data.bairro     || "";
    document.getElementById("address-city-state").value   = `${data.localidade} — ${data.uf}`;
    document.getElementById("address-number").value       = "";
    document.getElementById("address-complement").value   = "";
    result.style.display = "flex";
    status.textContent = "✅ Endereço encontrado! Confirme o número.";
    status.className = "cep-status cep-status--ok"; icon.textContent = "✓";
    setTimeout(() => document.getElementById("address-number").focus(), 100);
    // Recalcula taxa com o novo bairro
    updateCartPanel();
  } catch {
    status.textContent = "⚠️ Erro de conexão. Tente digitar manualmente.";
    status.className = "cep-status cep-status--error"; icon.textContent = "→";
  }
}

function buildAddressString() {
  const isCepMode = document.getElementById("address-cep-mode").style.display !== "none";
  if (!isCepMode) return document.getElementById("customer-address").value.trim();
  const street   = document.getElementById("address-street").value.trim();
  const number   = document.getElementById("address-number").value.trim();
  const comp     = document.getElementById("address-complement").value.trim();
  const neigh    = document.getElementById("address-neighborhood").value.trim();
  const city     = document.getElementById("address-city-state").value.trim();
  if (!street && !number) return "";
  return [street, number, comp, neigh, city].filter(Boolean).join(", ");
}

// ─── TELA DE SUCESSO ──────────────────────────────────────────

function showSuccessScreen({ orderNumber, customerName, customerPhone, customerAddr, total }) {
  const screen = document.getElementById("success-screen");

  // Preenche dados
  document.getElementById("success-order-number").textContent = orderNumber;
  document.getElementById("success-total").textContent = formatCurrency(total);

  const nameRow = document.getElementById("success-name-row");
  if (customerName) {
    document.getElementById("success-name").textContent = customerName;
    nameRow.style.display = "flex";
  } else {
    nameRow.style.display = "none";
  }

  const phoneRow = document.getElementById("success-phone-row");
  if (customerPhone) {
    document.getElementById("success-phone").textContent = customerPhone;
    phoneRow.style.display = "flex";
  } else {
    phoneRow.style.display = "none";
  }

  const addrRow = document.getElementById("success-address-row");
  if (customerAddr) {
    document.getElementById("success-address").textContent = customerAddr;
    addrRow.style.display = "flex";
  } else {
    addrRow.style.display = "none";
  }

  // Tempo de resposta do config
  const timeEl = document.getElementById("success-time");
  if (CONFIG.store.responseTime) {
    timeEl.innerHTML = `⏱️ Tempo médio de resposta: <strong>${CONFIG.store.responseTime}</strong>`;
    timeEl.style.display = "block";
  } else {
    timeEl.style.display = "none";
  }

  // Exibe a tela
  screen.classList.add("open");
  screen.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function hideSuccessScreen() {
  const screen = document.getElementById("success-screen");
  screen.classList.remove("open");
  screen.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
