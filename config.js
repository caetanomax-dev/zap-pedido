/**
 * ============================================================
 * CONFIG.JS — ARQUIVO DE CONFIGURAÇÃO DO CLIENTE
 * ============================================================
 * ✅ Este é o ÚNICO arquivo que precisa ser alterado
 *    para adaptar o sistema para um novo cliente.
 * ============================================================
 *
 * GUIA RÁPIDO — CAMPOS DE CADA PRODUTO:
 *
 *   id          → Número único do produto (não repetir)
 *   name        → Nome exibido no cardápio
 *   description → Descrição curta (ingredientes, tamanho etc.)
 *   price       → Preço em reais  (ex: 45.00)
 *   active      → true  = produto aparece no cardápio
 *                 false = produto fica oculto (sem excluir)
 *   stock       → true  = disponível para compra
 *                 false = aparece como "Indisponível" (não pode ser adicionado)
 *
 * DICA: Para esconder um produto temporariamente, use  active: false
 *       Para marcar como esgotado,                    use  stock: false
 * ============================================================
 */

const CONFIG = {

  // ----------------------------------------------------------
  // DADOS DA LOJA
  // ----------------------------------------------------------
  store: {
    name:            "Pizzaria MC",      // Nome que aparece no topo
    tagline:         "A melhor pizza da cidade",   // Subtítulo (opcional)
    logo:            "🍕",                         // Emoji ou URL de imagem (ex: "logo.png")
    whatsappNumber:  "5511987936283",              // ⚠️ Formato: 55 + DDD + número (sem espaços)
    responseTime:    "10 minutos",                 // Tempo médio de resposta (aparece na tela de sucesso)
  },

  // ----------------------------------------------------------
  // MENSAGEM DO PEDIDO (enviada pelo WhatsApp)
  // ----------------------------------------------------------
  order: {
    greeting: "Olá! Gostaria de fazer um pedido:",
    footer:   "Aguardo confirmação. Obrigado! 😊",
  },

  // ----------------------------------------------------------
  // CARDÁPIO — PRODUTOS POR CATEGORIA
  // ----------------------------------------------------------
  // ⚠️ Não repita IDs. Use números sequenciais únicos.
  // ----------------------------------------------------------
  menu: [
    {
      category: "🍕 Pizzas",
      items: [

        {
          id:          1,
          name:        "Pizza Margherita",
          description: "Molho, mussarela, manjericão",
          price:       45.00,
          active:      true,   // true = visível | false = oculto
          stock:       true,   // true = disponível | false = esgotado
        },
        {
          id:          2,
          name:        "Pizza Calabresa",
          description: "Calabresa, cebola, azeitona",
          price:       48.00,
          active:      true,
          stock:       true,
        },
        {
          id:          3,
          name:        "Pizza Quatro Queijos",
          description: "Mussarela, prato, provolone, gorgonzola",
          price:       52.00,
          active:      true,
          stock:       false,  // ← Exemplo: esgotada (aparece, mas não pode ser adicionada)
        },
        {
          id:          4,
          name:        "Pizza Portuguesa",
          description: "Presunto, ovo, palmito, mussarela",
          price:       50.00,
          active:      false,  // ← Exemplo: oculta (não aparece no cardápio)
          stock:       true,
        },

      ]
    },
    {
      category: "🥤 Bebidas",
      items: [

        {
          id:          5,
          name:        "Coca-Cola 2L",
          description: "Garrafa gelada",
          price:       12.00,
          active:      true,
          stock:       true,
        },
        {
          id:          6,
          name:        "Suco de Laranja",
          description: "Natural, 500ml",
          price:       10.00,
          active:      true,
          stock:       true,
        },
        {
          id:          7,
          name:        "Água Mineral",
          description: "500ml, sem gás",
          price:       4.00,
          active:      true,
          stock:       true,
        },
        {
          id:          8,
          name:        "Cerveja 600ml",
          description: "Long neck ou garrafa",
          price:       14.00,
          active:      true,
          stock:       true,
        },

      ]
    },
    {
      category: "🍰 Sobremesas",
      items: [

        {
          id:          9,
          name:        "Petit Gâteau",
          description: "Com sorvete de creme",
          price:       18.00,
          active:      true,
          stock:       true,
        },
        {
          id:          10,
          name:        "Pudim de Leite",
          description: "Receita da casa",
          price:       12.00,
          active:      true,
          stock:       true,
        },
        {
          id:          11,
          name:        "Brownie c/ Sorvete",
          description: "Brownie quente, sorvete de baunilha",
          price:       15.00,
          active:      true,
          stock:       true,
        },

      ]
    },
  ],

  // ----------------------------------------------------------
  // CONFIGURAÇÕES VISUAIS (opcional)
  // ----------------------------------------------------------
  ui: {
    primaryColor: "#25D366",   // Verde WhatsApp (padrão)
    accentColor:  "#128C7E",   // Verde escuro
    headerBg:     "#1a1a2e",   // Fundo do header
  },

  // ----------------------------------------------------------
  // PREPARAÇÃO PARA EVOLUÇÃO FUTURA
  // ----------------------------------------------------------
  // Quando o sistema evoluir para painel admin ou API,
  // basta trocar a fonte dos dados abaixo sem mexer no restante:
  //
  //   dataSource: "config"       → usa este arquivo (padrão atual)
  //   dataSource: "localStorage" → carrega do navegador
  //   dataSource: "api"          → carrega de uma URL externa
  //
  dataSource: "config",

};
