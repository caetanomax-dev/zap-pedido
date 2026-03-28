/**
 * ============================================================
 * APP.JS — ZapPedido
 * ============================================================
 */

// ─── ESTADO GLOBAL ────────────────────────────────────────────
const cart = {};
let pendingWhatsappUrl = null; // URL montada, aguarda confirmação no modal

// ─── INICIALIZAÇÃO ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
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
  document.getElementById("store-logo").textContent  = CONFIG.store.logo || "🛍️";
  if (CONFIG.ui) {
    const r = document.documentElement;
    if (CONFIG.ui.primaryColor) r.style.setProperty("--color-primary", CONFIG.ui.primaryColor);
    if (CONFIG.ui.accentColor)  r.style.setProperty("--color-accent",  CONFIG.ui.accentColor);
    if (CONFIG.ui.headerBg)     r.style.setProperty("--color-header",  CONFIG.ui.headerBg);
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
  const card = document.createElement("div");
  card.className = "product-card" + (inStock ? "" : " out-of-stock");
  card.id = `card-${item.id}`;
  card.innerHTML = `
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

  const total = cartItems.reduce((s, { item, quantity }) => s + item.price * quantity, 0);
  totalEl.textContent = formatCurrency(total);
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

// ─── MONTAR MENSAGEM ──────────────────────────────────────────

function buildMessage() {
  const cartItems       = Object.values(cart);
  const customerName    = document.getElementById("customer-name").value.trim();
  const customerPhone   = document.getElementById("customer-phone").value.trim();
  const customerAddress = buildAddressString();
  const selectedPayBtn  = document.querySelector(".pay-btn.selected");
  const paymentMethod   = selectedPayBtn?.dataset.value || null;
  const changeInput     = document.getElementById("customer-change").value.trim();
  const total           = cartItems.reduce((s, { item, quantity }) => s + item.price * quantity, 0);

  const itemLines = cartItems
    .map(({ item, quantity }) => `• ${item.name} x${quantity} — ${formatCurrency(item.price * quantity)}`)
    .join("\n");

  let msg = CONFIG.order.greeting + "\n\n";
  if (customerName)    msg += `👤 *Nome:* ${customerName}\n`;
  if (customerPhone)   msg += `📱 *Telefone:* ${customerPhone}\n`;
  if (customerAddress) msg += `📍 *Endereço:* ${customerAddress}\n`;
  msg += "\n";
  msg += `📋 *Itens do Pedido:*\n${itemLines}\n\n`;
  msg += `💰 *Total: ${formatCurrency(total)}*\n\n`;

  if (paymentMethod) {
    const labels = { pix: "Pix", credito: "Cartão de Crédito", debito: "Cartão de Débito", dinheiro: "Dinheiro" };
    msg += `💳 *Pagamento:* ${labels[paymentMethod]}\n`;
    if (paymentMethod === "dinheiro" && changeInput) {
      const changeValue = parseFloat(changeInput.replace(",", "."));
      if (!isNaN(changeValue) && changeValue >= total) {
        const troco = changeValue - total;
        msg += troco === 0
          ? `🔄 *Pagamento exato* — sem troco\n`
          : `🔄 *Troco para:* ${formatCurrency(changeValue)} _(troco: ${formatCurrency(troco)})_\n`;
      }
    }
    msg += "\n";
  }
  msg += CONFIG.order.footer;
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
  const total           = cartItems.reduce((s, { item, quantity }) => s + item.price * quantity, 0);
  const labels          = { pix: "💠 Pix", credito: "💳 Cartão de Crédito", debito: "🏦 Cartão de Débito", dinheiro: "💵 Dinheiro" };

  let trocoHtml = "";
  if (paymentMethod === "dinheiro" && changeInput) {
    const changeValue = parseFloat(changeInput.replace(",", "."));
    if (!isNaN(changeValue) && changeValue >= total) {
      const troco = changeValue - total;
      trocoHtml = troco === 0
        ? `<div class="preview-row"><span>Troco</span><strong>Valor exato</strong></div>`
        : `<div class="preview-row"><span>Troco para</span><strong>${formatCurrency(changeValue)} <em class="troco-val">(troco: ${formatCurrency(troco)})</em></strong></div>`;
    }
  }

  document.getElementById("modal-body").innerHTML = `
    <!-- Itens -->
    <div class="preview-section">
      <div class="preview-section-title">🛒 Itens</div>
      ${cartItems.map(({ item, quantity }) => `
        <div class="preview-row">
          <span>${item.name} <em class="qty-tag">×${quantity}</em></span>
          <strong>${formatCurrency(item.price * quantity)}</strong>
        </div>`).join("")}
      <div class="preview-row preview-total">
        <span>Total</span>
        <strong>${formatCurrency(total)}</strong>
      </div>
    </div>

    <!-- Dados -->
    <div class="preview-section">
      <div class="preview-section-title">👤 Dados</div>
      ${customerName    ? `<div class="preview-row"><span>Nome</span><strong>${customerName}</strong></div>` : ""}
      ${customerPhone   ? `<div class="preview-row"><span>Telefone</span><strong>${customerPhone}</strong></div>` : ""}
      ${customerAddress ? `<div class="preview-row"><span>Endereço</span><strong>${customerAddress}</strong></div>` : ""}
    </div>

    <!-- Pagamento -->
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

  // Monta a URL antes para usar no confirm
  const msg = buildMessage();
  pendingWhatsappUrl = `https://wa.me/${CONFIG.store.whatsappNumber}?text=${encodeURIComponent(msg)}`;

  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("order-modal").classList.add("open");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("order-modal").classList.remove("open");
  document.getElementById("modal-overlay").setAttribute("aria-hidden", "true");
  // NÃO remove overflow aqui — o carrinho pode ainda estar aberto
}

function confirmOrder() {
  if (!pendingWhatsappUrl) return;
  closeModal();
  closeCart();
  setTimeout(() => window.open(pendingWhatsappUrl, "_blank"), 320);
  pendingWhatsappUrl = null;
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
  document.querySelectorAll(".pay-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const alreadySelected = btn.classList.contains("selected");
      document.querySelectorAll(".pay-btn").forEach(b => b.classList.remove("selected"));
      if (!alreadySelected) btn.classList.add("selected");

      const isDinheiro = !alreadySelected && btn.dataset.value === "dinheiro";
      const changeWrap = document.getElementById("change-wrap");
      changeWrap.style.display = isDinheiro ? "flex" : "none";

      if (!isDinheiro) {
        document.getElementById("customer-change").value = "";
        document.getElementById("change-hint").textContent = "";
        clearFieldError(document.getElementById("change-wrap"));
      }

      // Limpa erro de pagamento ao selecionar
      const wrap = btn.closest(".field-wrap");
      if (wrap?.classList.contains("has-error")) clearFieldError(wrap);
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
