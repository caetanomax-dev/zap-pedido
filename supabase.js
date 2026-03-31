/**
 * ============================================================
 * SUPABASE.JS — v2
 * Realtime via polling + WebSocket fallback
 * ============================================================
 */

const SUPABASE_URL  = "https://iauaklejsieydboomhqi.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdWFrbGVqc2lleWRib29taHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDM2MjksImV4cCI6MjA5MDQ3OTYyOX0.GVQZneH5vgGQbdIra52LybKKU5CPVMN12_l7U-zlDfE";

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

  // ── Realtime via Supabase WebSocket (Canal Broadcast) ─────
  // Usa polling inteligente como fallback garantido
  _pollingIntervals: {},

  subscribe(table, onInsert, onUpdate, intervalMs = 4000) {
    let lastCheck = new Date().toISOString();

    // Tenta WebSocket nativo do Supabase primeiro
    let ws = null;
    try {
      const wsUrl = `${SUPABASE_URL.replace("https","wss")}/realtime/v1/websocket?apikey=${SUPABASE_ANON}&vsn=1.0.0`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          topic: `realtime:public:${table}`,
          event: "phx_join",
          payload: { config: { broadcast: { self: false }, presence: { key: "" }, postgres_changes: [{ event: "*", schema: "public", table }] } },
          ref: "1"
        }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "postgres_changes") {
            const payload = msg.payload?.data;
            if (!payload) return;
            if (payload.type === "INSERT" && onInsert) onInsert(payload.record);
            if (payload.type === "UPDATE" && onUpdate) onUpdate(payload.record);
          }
        } catch {}
      };

      ws.onerror = () => { ws = null; };
    } catch { ws = null; }

    // Polling como garantia (funciona sempre, mesmo sem WS)
    const poll = async () => {
      try {
        const since = lastCheck;
        lastCheck = new Date().toISOString();

        // Novos pedidos
        if (onInsert) {
          const newRows = await this.select(table,
            `created_at=gt.${since}&order=created_at.asc`
          );
          if (newRows?.length) newRows.forEach(r => onInsert(r));
        }

        // Pedidos atualizados
        if (onUpdate) {
          const updated = await this.select(table,
            `updated_at=gt.${since}&order=updated_at.asc`
          );
          if (updated?.length) updated.forEach(r => onUpdate(r));
        }
      } catch {}
    };

    const interval = setInterval(poll, intervalMs);
    this._pollingIntervals[table] = interval;

    return {
      close: () => {
        clearInterval(interval);
        if (ws) ws.close();
      }
    };
  },

  unsubscribe(table) {
    if (this._pollingIntervals[table]) {
      clearInterval(this._pollingIntervals[table]);
      delete this._pollingIntervals[table];
    }
  }
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

const STATUS_FLOW = ["received","accepted","preparing","delivering","delivered"];

const STATUS_MESSAGES = {
  accepted:   (n,s) => `✅ Olá! Seu pedido *${n}* foi *aceito* pela ${s}! Em instantes começamos a preparar. 😊`,
  preparing:  (n,s) => `👨‍🍳 Seu pedido *${n}* está *em preparo*! Aguarde mais um pouquinho. 🍕`,
  delivering: (n,s) => `🛵 Seu pedido *${n}* *saiu para entrega*! Nosso entregador está a caminho. 📍`,
  delivered:  (n,s) => `🎉 Pedido *${n}* *entregue*! Obrigado pela preferência. Volte sempre! ❤️`,
  cancelled:  (n,s) => `❌ Seu pedido *${n}* foi *cancelado*. Entre em contato para mais informações.`,
};
