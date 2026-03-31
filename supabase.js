/**
 * ============================================================
 * SUPABASE.JS — Configuração e helpers de banco de dados
 * ============================================================
 */

const SUPABASE_URL  = "https://iauaklejsieydboomhqi.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdWFrbGVqc2lleWRib29taHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDM2MjksImV4cCI6MjA5MDQ3OTYyOX0.GVQZneH5vgGQbdIra52LybKKU5CPVMN12_l7U-zlDfE";

// ── Cliente Supabase leve (sem SDK — fetch direto) ─────────
const sb = {
  headers: {
    "Content-Type":  "application/json",
    "apikey":        SUPABASE_ANON,
    "Authorization": `Bearer ${SUPABASE_ANON}`,
  },

  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:  "POST",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async select(table, params = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      headers: this.headers,
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method:  "PATCH",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Realtime via SSE
  subscribe(table, callback) {
    const url = `${SUPABASE_URL}/realtime/v1/sse?` +
      `apikey=${SUPABASE_ANON}&` +
      `event=*&` +
      `schema=public&` +
      `table=${table}`;

    const es = new EventSource(url);
    es.onmessage = (e) => {
      try { callback(JSON.parse(e.data)); } catch {}
    };
    return es; // retorna para poder fechar depois
  },
};

// ── Status dos pedidos ─────────────────────────────────────
const ORDER_STATUS = {
  received:   { label: "Recebido",            emoji: "📥", color: "#6366f1" },
  accepted:   { label: "Aceito",              emoji: "✅", color: "#22c55e" },
  preparing:  { label: "Em preparo",          emoji: "👨‍🍳", color: "#f59e0b" },
  delivering: { label: "Saindo para entrega", emoji: "🛵", color: "#3b82f6" },
  delivered:  { label: "Entregue",            emoji: "🎉", color: "#10b981" },
  cancelled:  { label: "Cancelado",           emoji: "❌", color: "#ef4444" },
};

const STATUS_FLOW = ["received", "accepted", "preparing", "delivering", "delivered"];

// Mensagens WhatsApp para cada transição de status
const STATUS_MESSAGES = {
  accepted:   (n, store) => `✅ Olá! Seu pedido *${n}* foi *aceito* pela ${store}! Em instantes começamos a preparar. 😊`,
  preparing:  (n, store) => `👨‍🍳 Seu pedido *${n}* está *em preparo* agora! Aguarde mais um pouquinho. 🍕`,
  delivering: (n, store) => `🛵 Seu pedido *${n}* *saiu para entrega*! Nosso entregador já está a caminho. Fique atento! 📍`,
  delivered:  (n, store) => `🎉 Pedido *${n}* *entregue*! Obrigado pela preferência. Volte sempre! ❤️`,
  cancelled:  (n, store) => `❌ Infelizmente seu pedido *${n}* foi *cancelado*. Entre em contato para mais informações.`,
};
