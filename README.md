# 📊 TecMarketing — Micro-SaaS para Gestão e Relatórios de Marketing

> **Projeto Desenvolvido por:** Gabriel Lucas da Silva Oliveira & Allan Victor Braga Dias  
> **Link de Acesso Local:** [http://localhost:5000](http://localhost:5000)

---

## 🎯 Sobre o Projeto

O **TecMarketing** é uma proposta de **Micro-SaaS** (Software as a Service por assinatura) projetada para solucionar a principal dor de pequenas agências de marketing, gestores de tráfego pago, social medias e consultores: **organizar dados dispersos de campanhas e gerar relatórios executivos claros de forma rápida e automatizada**.

O sistema foi inteiramente construído com base no roteiro dos **11 slides de apresentação** e reproduz com fidelidade de pixel o **Mockup do Produto (Slide 12)** encontrado na apresentação do Canva.

---

## 🚀 Como Executar o Sistema

O servidor web já se encontra em execução na porta `5000`.

Para acessar imediatamente, basta abrir em qualquer navegador:
👉 **[http://localhost:5000](http://localhost:5000)** ou **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

Caso queira reiniciar o servidor manualmente:
```bash
python app.py
```

---

## ⚡ Funcionalidades Implementadas

### 1. 📈 Dashboard Executivo (Inspirado fielmente no Slide 12)
- **4 Indicadores Técnicos Principais (Slide 4):**
  - **CTR (Click-Through Rate):** $\frac{\text{Cliques}}{\text{Impressões}} \times 100$ (Ex: `5,21%` com badge `+12,4%`)
  - **CPC (Custo Médio por Clique):** $\frac{\text{Investimento}}{\text{Cliques}}$ (Ex: `R$ 1,32` com economia de `-8,7%`)
  - **CPM (Custo por Mil Impressões):** $\frac{\text{Investimento}}{\text{Impressões}} \times 1000$ (Ex: `R$ 26,40` com `-10,2%`)
  - **ROAS (Return on Ad Spend):** $\frac{\text{Receita}}{\text{Investimento}}$ (Ex: `3,85x` com `+18,9%`)
- **Gráfico de Desempenho da Campanha:** Linhas em gradiente neon (Ciano para Impressões e Roxo para Cliques) exibindo a evolução temporal no período de 1 a 30 de janeiro.
- **Card Insights da IA ✨:** Diagnóstico dinâmico em linguagem natural com recomendações de escala e botão para nova análise.
- **Tabela de Campanhas Recentes:** Exibição com logos do **Meta Ads** e **Google Ads**, status com cores neons e links de ação.
- **Bloco de Ações Rápidas:** Botões em destaque para *Nova Campanha*, *Importar Dados (CSV)* e *Gerar Relatório (PDF)*.

### 2. 📥 Entrada de Dados: Manual e Importação CSV (Slide 5, 6 e 9)
- **Modal de Nova Campanha:** Cálculo em tempo real dos 4 indicadores à medida que o usuário digita os números de impressões, cliques, investimento e receita.
- **Importador CSV:** Suporte para arrastar e soltar arquivos CSV ou colar texto formatado, com download de planilha modelo (`sample_campaigns.csv`) e validação de dados antes da gravação.

### 3. 📄 Relatórios Personalizados em PDF (Slide 5 e 6)
- Geração instantânea de PDF White-Label com:
  - Marca e nome da agência personalizáveis
  - Indicadores técnicos em caixas de destaque
  - Parecer executivo da Inteligência Artificial
  - Tabela analítica das campanhas
  - Rodapé em conformidade com a LGPD

### 4. 🏢 Gestão de Clientes e Multi-Tenancy (Slide 6 e 8)
- Cadastro de clientes por segmento (E-commerce, B2B, Saúde, etc.)
- Controle de acessos e isolamento de informações entre agências.

### 5. 🛡️ Segurança e LGPD (Slide 8)
- "Segurança não é recurso extra: é requisito do produto."
- Ferramenta de exportação completa dos dados da agência em JSON para portabilidade de dados.

### 6. 💰 Modelos de Assinatura e Viabilidade Financeira (Slide 10)
- **Plano Entrada:** R$ 49/mês (Até 3 clientes, entrada manual)
- **Plano Intermediário (Ativo):** R$ 99/mês (Até 15 clientes, importação CSV, IA Insights, PDF White-Label)
- **Plano Avançado:** R$ 199/mês (Clientes ilimitados, múltiplos membros)
- Comparativo de custos: Desenvolvimento próprio (R$ 500 – 3.000) vs Freelancer (R$ 12.500 – 30.000).

### 7. 🎙️ Modo Pitch & Apresentação (Gabriel & Allan)
- Acesso pela aba **"Roteiro do Pitch (11 Slides)"**:
  - Cronômetro interativo com meta de 4min35s (deixando 25s para transições).
  - Roteiro de fala slide a slide dividido entre Gabriel e Allan.
  - Palavras-chave para memorização.
  - Miniaturas e imagens reais dos slides da apresentação do Canva.

---

## 🛠️ Tecnologias Utilizadas (Slide 7)

- **Backend:** Python com Flask, SQLite e API RESTful.
- **Frontend:** HTML5 semântico, Tailwind CSS (Modern Dark SaaS), ícones Lucide Icons.
- **Gráficos:** Chart.js com renderização vetorial e gradientes neon.
- **Exportação PDF:** jsPDF e AutoTable para renderização de relatórios do lado do cliente.
- **Inteligência Artificial:** Mecanismo analítico para síntese de diagnósticos de tráfego pago.
