# 📲 ZapPedido — Sistema de Pedidos via WhatsApp

MVP funcional para pequenos comércios. Zero backend, zero dependências, zero custo de servidor.

---

## 🚀 Como Rodar Localmente

### Opção 1 — Abrir direto no navegador
```bash
# Simplesmente abra o arquivo index.html no navegador
# Clique duplo no arquivo ou arraste para o Chrome/Firefox
```

### Opção 2 — Servidor local simples (recomendado para testes)
```bash
# Com Python (já instalado na maioria dos sistemas)
cd zap-pedido
python3 -m http.server 8080
# Acesse: http://localhost:8080

# Com Node.js
npx serve .
# Acesse: http://localhost:3000
```

---

## ⚙️ Como Adaptar para um Novo Cliente

**Você só precisa editar 1 arquivo: `config.js`**

```javascript
const CONFIG = {
  store: {
    name: "Nome da Loja do Cliente",      // ← Troque aqui
    tagline: "Slogan opcional",           // ← Troque aqui
    logo: "🍔",                           // ← Emoji ou "logo.png"
    whatsappNumber: "5511987654321",      // ← ⚠️ Número com DDI+DDD
  },
  menu: [
    {
      category: "🥤 Bebidas",
      items: [
        { id: 1, name: "Produto",  price: 10.00, description: "Descrição" },
        { id: 2, name: "Produto2", price: 15.00, description: "Descrição" },
      ]
    }
  ]
};
```

### Checklist para novo cliente:
- [ ] Alterar `store.name`
- [ ] Alterar `store.whatsappNumber` (formato: 55 + DDD + número)
- [ ] Substituir os produtos em `menu`
- [ ] Ajustar o emoji/logo
- [ ] Hospedar (ver seção abaixo)

---

## 🌐 Como Hospedar (Opções Gratuitas)

### ✅ Opção 1 — Netlify Drop (MAIS FÁCIL - 2 minutos)
1. Acesse **https://app.netlify.com/drop**
2. Arraste a pasta `zap-pedido` para a área indicada
3. Pronto! URL gerada automaticamente (ex: `https://amazing-pie-123.netlify.app`)
4. Você pode personalizar o subdomínio nas configurações

### ✅ Opção 2 — GitHub Pages (Gratuito)
1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Vá em Settings → Pages → Deploy from branch: `main`
4. URL: `https://seu-usuario.github.io/nome-repo`

### ✅ Opção 3 — Vercel (Gratuito, mais profissional)
```bash
npm install -g vercel
cd zap-pedido
vercel
# Siga os prompts — URL gerada em segundos
```

### 💰 Opção 4 — Hostinger/Hostgator (Pago, para domínio próprio)
- Contrate um plano básico (~R$15/mês)
- Faça upload via FTP ou painel de arquivos
- Configure domínio: `cardapio.nomedocliente.com.br`
- **Recomendado para clientes que querem domínio próprio**

---

## 📁 Estrutura do Projeto

```
zap-pedido/
├── index.html      # Estrutura da página (não precisa mexer)
├── config.js       # ⭐ ARQUIVO DO CLIENTE (único que muda)
├── app.js          # Lógica do sistema (não precisa mexer)
├── style.css       # Visual (só se quiser personalizar cores)
└── README.md       # Este arquivo
```

---

## 💬 Exemplo de Mensagem Gerada

```
Olá! Gostaria de fazer um pedido:

👤 Cliente: João Silva

📋 Itens do Pedido:
• Pizza Margherita x1 — R$ 45,00
• Coca-Cola 2L x2 — R$ 24,00
• Petit Gâteau x1 — R$ 18,00

💰 Total: R$ 87,00

Aguardo confirmação. Obrigado! 😊
```

---

## 🔧 Personalização Visual

Para mudar as cores, edite as variáveis no topo do `style.css`:

```css
:root {
  --color-primary: #25D366;  /* Verde WhatsApp */
  --color-accent:  #128C7E;  /* Verde escuro */
  --color-header:  #1a1a2e;  /* Fundo do header */
}
```

Ou use o campo `ui` do `config.js`:
```javascript
ui: {
  primaryColor: "#FF6B35",  // Laranja (ex: lanchonete)
  accentColor:  "#E55A2B",
  headerBg:     "#2D1B69",
}
```

---

## 📊 Fase 2 — Roadmap de Evolução

### 🗄️ Banco de Dados
- **Supabase** (PostgreSQL gratuito) para armazenar produtos e pedidos
- Tabelas: `stores`, `products`, `orders`, `order_items`
- API REST automática sem escrever código de backend

### 🖥️ Painel de Edição de Produtos
- Interface simples em React ou mesmo HTML puro
- CRUD de produtos: criar, editar, excluir, ativar/desativar
- Upload de fotos dos produtos
- Controle de estoque básico (disponível / indisponível)

### 🔗 Integração com Sistemas de PDV
- **Frente de Caixa / Colibri / Linx:** exportar cardápio via planilha CSV
- **API REST:** webhooks para receber pedidos no PDV automaticamente
- Sincronização de preços em tempo real

### 📱 API Oficial do WhatsApp (Business API)
- **Twilio / Z-API / Evolution API:** enviar confirmações automáticas
- Templates de mensagem: confirmação, tempo estimado, pronto para entrega
- **Elimina** a dependência do cliente abrir o WhatsApp manualmente
- Histórico de pedidos com status

### 💳 Pagamento Online (Fase 3)
- **Mercado Pago / PagSeguro:** checkout integrado antes de enviar ao WhatsApp
- Pedido só vai para o lojista após pagamento confirmado
- Dashboard de faturamento por loja

### 🏢 Multi-tenant (Plataforma SaaS)
- Um painel central para gerenciar múltiplos clientes
- Login por loja com autenticação (Supabase Auth ou Clerk)
- Cobrança automática por assinatura (Stripe ou Mercado Pago)
- Subdomínio por cliente: `pizzabella.zappedido.com.br`

---

## 💡 Modelo de Negócio Sugerido

| Plano | Preço/mês | Incluído |
|-------|-----------|----------|
| Básico | R$ 49 | Cardápio + WhatsApp, até 20 produtos |
| Pro | R$ 99 | + Painel de edição, produtos ilimitados |
| Business | R$ 199 | + Domínio próprio + suporte prioritário |

**Setup fee:** R$ 150 - R$ 300 (configuração inicial para o cliente)

---

*Construído para ser vendido. Simples, funcional, rentável.*
