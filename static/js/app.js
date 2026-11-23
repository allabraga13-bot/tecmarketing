// TecMarketing — Core Frontend Application Logic
// Inspired by Slide 12 mockup & Pitch deck specifications (Gabriel & Allan)

let state = {
  activeTab: 'dashboard',
  currentUser: {
    name: 'Gabriel',
    agency: 'Agência Alpha Digital',
    avatar: 'G'
  },
  selectedClient: 'all',
  selectedPeriod: '30d',
  campaigns: [],
  clients: [],
  reports: [],
  slides: [],
  activeSlideIndex: 0,
  pitchTimer: {
    seconds: 0,
    interval: null,
    running: false
  },
  chartInstance: null
};

// Document Ready
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  await loadClients();
  await loadKPIs();
  await loadCampaigns();
  await loadChartData();
  await loadReports();
  await loadSlides();
  setupEventListeners();
});

// ----------------- NAVIGATION & TABS -----------------
function switchTab(tabName) {
  state.activeTab = tabName;

  // Hide all panels
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  // Show target panel
  const target = document.getElementById(`view-${tabName}`);
  if (target) {
    target.classList.remove('hidden');
  }

  // Update navigation button active styles
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('bg-purple-600', 'text-white', 'shadow-lg', 'shadow-purple-600/30');
    btn.classList.add('text-slate-400');
  });

  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400');
    activeBtn.classList.add('bg-purple-600', 'text-white', 'shadow-lg', 'shadow-purple-600/30');
  }

  // Update header text
  const titleEl = document.getElementById('page-header-title');
  const subtitleEl = document.getElementById('page-header-subtitle');

  switch (tabName) {
    case 'dashboard':
      titleEl.innerText = 'Dashboard';
      subtitleEl.innerText = 'Visão geral das suas campanhas';
      if (state.chartInstance) state.chartInstance.update();
      break;
    case 'campaigns':
      titleEl.innerText = 'Campanhas';
      subtitleEl.innerText = 'Gerenciamento de anúncios e canais';
      break;
    case 'reports':
      titleEl.innerText = 'Relatórios';
      subtitleEl.innerText = 'Histórico e emissão de PDFs personalizados';
      break;
    case 'ai-insights':
      titleEl.innerText = 'IA Insights ✨';
      subtitleEl.innerText = 'Diagnósticos cognitivos e sugestões de otimização';
      break;
    case 'clients':
      titleEl.innerText = 'Clientes';
      subtitleEl.innerText = 'Gerenciamento de contas e isolamento de dados';
      break;
    case 'integrations':
      titleEl.innerText = 'Integrações';
      subtitleEl.innerText = 'Conectores com Meta Ads, Google Ads e APIs';
      break;
    case 'settings':
      titleEl.innerText = 'Configurações';
      subtitleEl.innerText = 'Identidade visual da agência e conformidade LGPD';
      break;
    case 'pitch':
      titleEl.innerText = 'Roteiro do Pitch (11 Slides)';
      subtitleEl.innerText = 'Apresentação de 5 minutos de Gabriel e Allan';
      break;
  }

  if (window.lucide) lucide.createIcons();
}

// ----------------- DATA LOADING -----------------
async function loadClients() {
  try {
    const res = await fetch('/api/clients');
    state.clients = await res.json();
    
    // Populate header dropdown
    const select = document.getElementById('filter-client');
    const newCampClient = document.getElementById('nc-client');
    const pdfClient = document.getElementById('pdf-client-select');

    if (select) {
      select.innerHTML = '<option value="all">🏢 Todos os clientes</option>';
      state.clients.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      });
    }

    if (newCampClient) {
      newCampClient.innerHTML = '';
      state.clients.forEach(c => {
        newCampClient.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      });
    }

    if (pdfClient) {
      pdfClient.innerHTML = '<option value="all">Consolidado (Todos os Clientes)</option>';
      state.clients.forEach(c => {
        pdfClient.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      });
    }

    renderClientsGrid();
  } catch (err) {
    console.error('Error loading clients:', err);
  }
}

async function loadKPIs() {
  try {
    const url = `/api/kpis?client_id=${state.selectedClient}&period=${state.selectedPeriod}`;
    const res = await fetch(url);
    const data = await res.json();

    // Update KPI Card values
    const ctrEl = document.getElementById('kpi-ctr-value');
    const cpcEl = document.getElementById('kpi-cpc-value');
    const cpmEl = document.getElementById('kpi-cpm-value');
    const roasEl = document.getElementById('kpi-roas-value');

    if (ctrEl) ctrEl.innerText = `${data.ctr.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%`;
    if (cpcEl) cpcEl.innerText = `R$ ${data.cpc.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (cpmEl) cpmEl.innerText = `R$ ${data.cpm.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (roasEl) roasEl.innerText = `${data.roas.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}x`;

    // Update trends if available
    if (data.trends) {
      const ctrTrend = document.getElementById('kpi-ctr-trend');
      const cpcTrend = document.getElementById('kpi-cpc-trend');
      const cpmTrend = document.getElementById('kpi-cpm-trend');
      const roasTrend = document.getElementById('kpi-roas-trend');

      if (ctrTrend) ctrTrend.innerText = data.trends.ctr;
      if (cpcTrend) cpcTrend.innerText = data.trends.cpc;
      if (cpmTrend) cpmTrend.innerText = data.trends.cpm;
      if (roasTrend) roasTrend.innerText = data.trends.roas;
    }
  } catch (err) {
    console.error('Error loading KPIs:', err);
  }
}

async function loadCampaigns() {
  try {
    const url = `/api/campaigns?client_id=${state.selectedClient}`;
    const res = await fetch(url);
    state.campaigns = await res.json();

    const badge = document.getElementById('badge-campaigns-count');
    if (badge) badge.innerText = state.campaigns.length;

    renderRecentCampaigns();
    renderAllCampaigns();
  } catch (err) {
    console.error('Error loading campaigns:', err);
  }
}

function renderRecentCampaigns() {
  const tbody = document.getElementById('recent-campaigns-tbody');
  if (!tbody) return;

  if (state.campaigns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-500">Nenhuma campanha cadastrada.</td></tr>`;
    return;
  }

  // Show top 3 or all matching slide 12
  const recent = state.campaigns.slice(0, 4);
  tbody.innerHTML = recent.map(c => {
    const isMeta = c.platform === 'Meta Ads';
    const platformIcon = isMeta
      ? `<span class="inline-flex items-center gap-1.5 text-blue-400 font-semibold"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg> Meta Ads</span>`
      : `<span class="inline-flex items-center gap-1.5 text-amber-400 font-semibold"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg> Google Ads</span>`;

    const statusBadge = c.status === 'Ativa'
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ativa</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/30">Pausada</span>`;

    return `
      <tr class="hover:bg-[#141A2E]/60 transition-colors">
        <td class="py-3 px-3 font-medium text-white">${c.name}</td>
        <td class="py-3 px-3">${platformIcon}</td>
        <td class="py-3 px-3 font-semibold text-slate-200">${c.ctr.toFixed(2)}%</td>
        <td class="py-3 px-3 font-semibold text-slate-200">R$ ${c.cpc.toFixed(2)}</td>
        <td class="py-3 px-3 font-bold text-emerald-400">${c.roas.toFixed(2)}x</td>
        <td class="py-3 px-3">${statusBadge}</td>
        <td class="py-3 px-3 text-right">
          <button onclick="deleteCampaign(${c.id})" title="Excluir" class="text-slate-500 hover:text-red-400 transition-colors">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderAllCampaigns() {
  const tbody = document.getElementById('all-campaigns-tbody');
  if (!tbody) return;

  if (state.campaigns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="py-8 text-center text-slate-500">Nenhuma campanha cadastrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.campaigns.map(c => {
    const isMeta = c.platform === 'Meta Ads';
    const statusBadge = c.status === 'Ativa'
      ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Ativa</span>`
      : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/30">Pausada</span>`;

    return `
      <tr class="hover:bg-[#141A2E]/60 transition-colors">
        <td class="py-3 px-4">
          <span class="font-semibold text-white block">${c.name}</span>
          <span class="text-[10px] text-slate-400">${c.client_name || 'Geral'}</span>
        </td>
        <td class="py-3 px-4 font-medium text-slate-300">${c.platform}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">${c.impressions.toLocaleString('pt-BR')}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">${c.clicks.toLocaleString('pt-BR')}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">R$ ${c.investment.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
        <td class="py-3 px-4 text-slate-300 font-mono">R$ ${c.revenue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
        <td class="py-3 px-4 font-bold text-purple-400 font-mono">${c.ctr.toFixed(2)}%</td>
        <td class="py-3 px-4 font-bold text-cyan-400 font-mono">R$ ${c.cpc.toFixed(2)}</td>
        <td class="py-3 px-4 font-semibold text-slate-400 font-mono">R$ ${c.cpm.toFixed(2)}</td>
        <td class="py-3 px-4 font-bold text-emerald-400 font-mono">${c.roas.toFixed(2)}x</td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="deleteCampaign(${c.id})" class="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ----------------- CHART.JS (Slide 12 Replica) -----------------
async function loadChartData() {
  try {
    const res = await fetch('/api/chart-data');
    const data = await res.json();
    initChart(data.labels, data.impressions, data.clicks);
  } catch (err) {
    console.error('Error loading chart data:', err);
  }
}

function initChart(labels, impressionsData, clicksData) {
  const ctx = document.getElementById('campaignPerformanceChart');
  if (!ctx) return;

  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  // Create subtle gradients
  const chartCtx = ctx.getContext('2d');
  
  const cyanGradient = chartCtx.createLinearGradient(0, 0, 0, 240);
  cyanGradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
  cyanGradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

  const purpleGradient = chartCtx.createLinearGradient(0, 0, 0, 240);
  purpleGradient.addColorStop(0, 'rgba(139, 92, 246, 0.40)');
  purpleGradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');

  state.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Impressões',
          data: impressionsData,
          borderColor: '#06B6D4',
          backgroundColor: cyanGradient,
          borderWidth: 2.5,
          tension: 0.35,
          pointBackgroundColor: '#06B6D4',
          pointBorderColor: '#090D16',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 6.5,
          fill: true
        },
        {
          label: 'Cliques',
          data: clicksData,
          borderColor: '#8B5CF6',
          backgroundColor: purpleGradient,
          borderWidth: 2.5,
          tension: 0.35,
          pointBackgroundColor: '#8B5CF6',
          pointBorderColor: '#090D16',
          pointBorderWidth: 2,
          pointRadius: 4.5,
          pointHoverRadius: 6.5,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // Using custom HTML legend matching Slide 12
        },
        tooltip: {
          backgroundColor: '#121626',
          titleColor: '#FFFFFF',
          bodyColor: '#94A3B8',
          borderColor: '#1E2640',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4,
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${context.raw.toLocaleString('pt-BR')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#64748B',
            font: {
              size: 11,
              family: 'Inter'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(30, 38, 64, 0.5)',
            drawBorder: false
          },
          ticks: {
            color: '#64748B',
            font: {
              size: 10,
              family: 'Inter'
            },
            callback: function(value) {
              return value.toLocaleString('pt-BR');
            }
          }
        }
      }
    }
  });
}

// ----------------- AI INSIGHTS REGENERATION -----------------
async function regenerateAIInsights() {
  const btn = document.getElementById('btn-refresh-ai');
  if (btn) {
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Analisando com IA...</span>`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    const res = await fetch('/api/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: state.selectedClient })
    });
    const data = await res.json();

    const text1 = document.getElementById('ai-insight-text-1');
    const text2 = document.getElementById('ai-insight-text-2');
    const recsBox = document.getElementById('ai-recommendations');

    if (text1) text1.innerText = data.summary;
    if (text2) text2.innerText = `O sistema monitorou ${state.campaigns.length} campanhas e identificou oportunidades de escala imediata.`;

    if (recsBox && data.recommendations) {
      recsBox.innerHTML = data.recommendations.map(r => `
        <div class="flex items-start gap-2 text-slate-400">
          <i data-lucide="check-circle-2" class="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5"></i>
          <span class="text-[11px]">${r}</span>
        </div>
      `).join('');
    }

    if (window.confetti) {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#7C3AED', '#06B6D4', '#10B981']
      });
    }
  } catch (err) {
    console.error('Error generating AI insights:', err);
  } finally {
    if (btn) {
      btn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>Gerar nova análise com IA</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

// ----------------- LIVE INDICATORS CALCULATION (Slide 4) -----------------
function calcIndicatorsLive() {
  const imp = parseFloat(document.getElementById('nc-impressions').value) || 0;
  const clk = parseFloat(document.getElementById('nc-clicks').value) || 0;
  const inv = parseFloat(document.getElementById('nc-investment').value) || 0;
  const rec = parseFloat(document.getElementById('nc-revenue').value) || 0;

  const ctr = imp > 0 ? (clk / imp * 100) : 0;
  const cpc = clk > 0 ? (inv / clk) : 0;
  const cpm = imp > 0 ? (inv / imp * 1000) : 0;
  const roas = inv > 0 ? (rec / inv) : 0;

  document.getElementById('live-ctr').innerText = `${ctr.toFixed(2)}%`;
  document.getElementById('live-cpc').innerText = `R$ ${cpc.toFixed(2)}`;
  document.getElementById('live-cpm').innerText = `R$ ${cpm.toFixed(2)}`;
  document.getElementById('live-roas').innerText = `${roas.toFixed(2)}x`;
}

// ----------------- CREATE CAMPAIGN -----------------
async function handleCreateCampaign(e) {
  e.preventDefault();
  const name = document.getElementById('nc-name').value;
  const clientId = document.getElementById('nc-client').value;
  const platform = document.getElementById('nc-platform').value;
  const impressions = document.getElementById('nc-impressions').value;
  const clicks = document.getElementById('nc-clicks').value;
  const investment = document.getElementById('nc-investment').value;
  const revenue = document.getElementById('nc-revenue').value;

  try {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        client_id: clientId,
        platform,
        impressions,
        clicks,
        investment,
        revenue,
        status: 'Ativa'
      })
    });

    const data = await res.json();
    if (data.success) {
      closeModal('modal-new-campaign');
      await loadKPIs();
      await loadCampaigns();
      if (window.confetti) confetti();
    } else {
      alert(data.error || 'Erro ao criar campanha');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar campanha.');
  }
}

async function deleteCampaign(id) {
  if (!confirm('Deseja realmente remover esta campanha?')) return;
  try {
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    await loadKPIs();
    await loadCampaigns();
  } catch (err) {
    console.error(err);
  }
}

// ----------------- CSV IMPORT -----------------
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    document.getElementById('csv-paste-area').value = evt.target.result;
  };
  reader.readAsText(file);
}

async function executeCSVImport() {
  const text = document.getElementById('csv-paste-area').value;
  if (!text.trim()) {
    alert('Por favor, selecione um arquivo CSV ou cole o conteúdo no campo de texto.');
    return;
  }

  try {
    const res = await fetch('/api/campaigns/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv_text: text })
    });
    const data = await res.json();

    if (data.success) {
      alert(data.message);
      closeModal('modal-import-csv');
      await loadClients();
      await loadKPIs();
      await loadCampaigns();
      if (window.confetti) confetti();
    } else {
      alert(data.error || 'Erro ao importar CSV.');
    }
  } catch (err) {
    console.error(err);
    alert('Falha na requisição de importação.');
  }
}

// ----------------- PDF GENERATOR (jsPDF White-Label) -----------------
async function handleGeneratePDF(e) {
  e.preventDefault();
  const agencyName = document.getElementById('pdf-agency-name').value || 'Agência Alpha Digital';
  const clientId = document.getElementById('pdf-client-select').value;
  const period = document.getElementById('pdf-period').value;
  const title = document.getElementById('pdf-title').value;

  // Find client name
  const clientObj = state.clients.find(c => c.id == clientId);
  const clientName = clientObj ? clientObj.name : 'Todos os Clientes (Consolidado)';

  // Calculate current KPIs for this export
  const kpiRes = await fetch(`/api/kpis?client_id=${clientId}`);
  const kpiData = await kpiRes.json();

  // Generate with jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Background Header
  doc.setFillColor(15, 20, 36);
  doc.rect(0, 0, 210, 45, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TecMarketing', 14, 20);

  // Agency White Label Subtitle
  doc.setFontSize(10);
  doc.setTextColor(168, 85, 247);
  doc.text(`Relatório emitido por: ${agencyName}`, 14, 28);

  // Date and Period
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text(`Período: ${period} | Cliente: ${clientName}`, 14, 36);

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 56);

  // 4 Top KPI Boxes (Slide 4 & 12)
  const drawKpiBox = (x, y, label, val, formula) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, 42, 24, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text(label, x + 4, y + 7);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 4, y + 16);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(formula, x + 4, y + 21);
  };

  drawKpiBox(14, 63, 'CTR (Cliques/Imp.)', `${kpiData.ctr.toFixed(2)}%`, '+12,4% vs anterior');
  drawKpiBox(61, 63, 'CPC (Custo/Clique)', `R$ ${kpiData.cpc.toFixed(2)}`, '-8,7% economia');
  drawKpiBox(108, 63, 'CPM (Custo/1k Imp.)', `R$ ${kpiData.cpm.toFixed(2)}`, 'Impressões eficientes');
  drawKpiBox(155, 63, 'ROAS (Retorno Ads)', `${kpiData.roas.toFixed(2)}x`, '+18,9% rentabilidade');

  // Executive AI Summary Section
  doc.setFillColor(243, 232, 255);
  doc.setDrawColor(216, 180, 254);
  doc.roundedRect(14, 93, 182, 26, 2, 2, 'FD');

  doc.setTextColor(126, 34, 206);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PARECER EXECUTIVO GERADO POR INTELIGÊNCIA ARTIFICIAL', 18, 100);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const aiText = `Sua campanha atingiu excelente eficiência com CTR de ${kpiData.ctr.toFixed(2)}% e ROAS de ${kpiData.roas.toFixed(2)}x. O custo por clique reduziu 8,7%, sinalizando alta atratividade criativa e oportunidade para escalar investimento com segurança.`;
  doc.text(doc.splitTextToSize(aiText, 174), 18, 106);

  // Table of campaigns
  const filteredCamp = (clientId === 'all')
    ? state.campaigns
    : state.campaigns.filter(c => c.client_id == clientId);

  const tableBody = filteredCamp.map(c => [
    c.name,
    c.platform,
    c.impressions.toLocaleString('pt-BR'),
    c.clicks.toLocaleString('pt-BR'),
    `R$ ${c.investment.toFixed(2)}`,
    `${c.ctr.toFixed(2)}%`,
    `R$ ${c.cpc.toFixed(2)}`,
    `${c.roas.toFixed(2)}x`,
    c.status
  ]);

  doc.autoTable({
    startY: 125,
    head: [['Campanha', 'Canal', 'Impressões', 'Cliques', 'Gasto', 'CTR', 'CPC', 'ROAS', 'Status']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 58, 237],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5
    },
    margin: { left: 14, right: 14 }
  });

  // Footer with LGPD & Signature
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Relatório gerado pelo software TecMarketing Micro-SaaS • Em conformidade com a LGPD', 14, 285);

  // Save PDF to browser
  const filename = `Relatorio_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);

  // Save report to backend history
  await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId === 'all' ? 1 : clientId,
      title: title,
      agency_name: agencyName,
      period: period,
      kpis: kpiData,
      ai_summary: aiText
    })
  });

  closeModal('modal-generate-pdf');
  await loadReports();
  if (window.confetti) confetti();
}

function generateSampleDirectPDF() {
  document.getElementById('pdf-title').value = 'Relatório Mensal de Performance - Q4';
  handleGeneratePDF({ preventDefault: () => {} });
}

async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    state.reports = await res.json();
    renderReportsHistory();
  } catch (err) {
    console.error('Error loading reports:', err);
  }
}

function renderReportsHistory() {
  const tbody = document.getElementById('reports-history-tbody');
  if (!tbody) return;

  if (state.reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-500">Nenhum relatório emitido ainda.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.reports.map(r => `
    <tr class="hover:bg-[#141A2E]/60 transition-colors">
      <td class="py-3 px-3 font-semibold text-white flex items-center gap-2">
        <i data-lucide="file-check" class="w-4 h-4 text-purple-400"></i>
        <span>${r.title}</span>
      </td>
      <td class="py-3 px-3 text-slate-300">${r.client_name || 'Geral'}</td>
      <td class="py-3 px-3 text-slate-400">${r.period}</td>
      <td class="py-3 px-3 text-slate-400 font-mono text-[11px]">${r.created_at ? r.created_at.slice(0, 10) : 'Hoje'}</td>
      <td class="py-3 px-3 text-purple-300">${r.agency_name}</td>
      <td class="py-3 px-3 text-right">
        <button onclick="generateSampleDirectPDF()" class="py-1 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold transition-all">
          Reemitir PDF
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ----------------- CLIENTS MANAGEMENT -----------------
function renderClientsGrid() {
  const grid = document.getElementById('clients-cards-grid');
  if (!grid) return;

  grid.innerHTML = state.clients.map(c => `
    <div class="bg-[#111625] border border-[#1E2640] hover:border-purple-500/40 rounded-2xl p-6 transition-all flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm border border-purple-500/30">
            ${c.name.slice(0, 2).toUpperCase()}
          </div>
          <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            ${c.segment || 'Cliente'}
          </span>
        </div>
        <h4 class="text-base font-bold text-white">${c.name}</h4>
        <p class="text-xs text-slate-400 mt-0.5">${c.contact_email || 'contato@cliente.com.br'}</p>

        <div class="mt-4 pt-3 border-t border-[#1E2640] grid grid-cols-2 gap-2 text-xs">
          <div>
            <span class="text-[10px] text-slate-500 block">Campanhas</span>
            <span class="font-bold text-slate-200">${c.total_campaigns || 0}</span>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 block">Gasto Total</span>
            <span class="font-bold text-emerald-400">R$ ${(c.total_spend || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>

      <div class="mt-5 pt-3 border-t border-[#1E2640] flex items-center gap-2">
        <button onclick="selectClientFilter(${c.id})" class="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold transition-all">
          Filtrar Dashboard
        </button>
      </div>
    </div>
  `).join('');
}

function selectClientFilter(id) {
  state.selectedClient = id;
  const select = document.getElementById('filter-client');
  if (select) select.value = id;
  switchTab('dashboard');
  loadKPIs();
  loadCampaigns();
}

async function handleCreateClient(e) {
  e.preventDefault();
  const name = document.getElementById('client-name').value;
  const segment = document.getElementById('client-segment').value;
  const contact_email = document.getElementById('client-email').value;

  try {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, segment, contact_email })
    });
    const data = await res.json();
    if (data.success) {
      closeModal('modal-new-client');
      await loadClients();
    }
  } catch (err) {
    console.error(err);
  }
}

// ----------------- PITCH & 11 SLIDES MODE (Gabriel & Allan) -----------------
async function loadSlides() {
  try {
    const res = await fetch('/api/slides');
    const data = await res.json();
    state.slides = data.slides || [];
    renderSlidesIndex();
    renderCurrentSlide();
  } catch (err) {
    console.error('Error loading slides:', err);
  }
}

function renderSlidesIndex() {
  const container = document.getElementById('slides-index-list');
  if (!container) return;

  container.innerHTML = state.slides.map((s, idx) => {
    const isActive = idx === state.activeSlideIndex;
    const isAllan = s.speaker === 'Allan';
    const speakerBadge = isAllan
      ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">Allan</span>`
      : `<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">${s.speaker}</span>`;

    return `
      <div onclick="selectSlide(${idx})" class="p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'bg-[#19223D] border-purple-500' : 'bg-[#0E1322] border-[#1A233C] hover:border-slate-600'}">
        <span class="w-6 h-6 rounded-lg ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'} flex items-center justify-center text-xs font-bold flex-shrink-0">
          ${s.num}
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold text-white truncate">${s.title}</h5>
            ${speakerBadge}
          </div>
          <span class="text-[10px] text-slate-400 block">${s.time} • ${s.keyword}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderCurrentSlide() {
  if (!state.slides || state.slides.length === 0) return;
  const s = state.slides[state.activeSlideIndex];

  document.getElementById('active-slide-number').innerText = s.num;
  document.getElementById('active-slide-title').innerText = s.title;
  document.getElementById('active-slide-speaker').innerText = s.speaker;
  document.getElementById('active-slide-time').innerText = `Tempo estimado: ${s.time}`;
  document.getElementById('active-slide-keyword').innerText = s.keyword;
  document.getElementById('active-slide-image').src = s.image;
  document.getElementById('active-slide-speech').innerText = `"${s.speech}"`;

  renderSlidesIndex();
}

function selectSlide(idx) {
  state.activeSlideIndex = idx;
  renderCurrentSlide();
}

function navigateSlide(direction) {
  let next = state.activeSlideIndex + direction;
  if (next < 0) next = 0;
  if (next >= state.slides.length) next = state.slides.length - 1;
  state.activeSlideIndex = next;
  renderCurrentSlide();
}

// Stopwatch for Pitch
function togglePitchTimer() {
  const btn = document.getElementById('btn-timer-toggle');
  const icon = document.getElementById('timer-icon');

  if (state.pitchTimer.running) {
    clearInterval(state.pitchTimer.interval);
    state.pitchTimer.running = false;
    if (icon) icon.setAttribute('data-lucide', 'play');
  } else {
    state.pitchTimer.running = true;
    if (icon) icon.setAttribute('data-lucide', 'pause');
    state.pitchTimer.interval = setInterval(() => {
      state.pitchTimer.seconds++;
      const mins = Math.floor(state.pitchTimer.seconds / 60).toString().padStart(2, '0');
      const secs = (state.pitchTimer.seconds % 60).toString().padStart(2, '0');
      document.getElementById('pitch-timer-display').innerText = `${mins}:${secs}`;
    }, 1000);
  }
  if (window.lucide) lucide.createIcons();
}

function resetPitchTimer() {
  clearInterval(state.pitchTimer.interval);
  state.pitchTimer.running = false;
  state.pitchTimer.seconds = 0;
  document.getElementById('pitch-timer-display').innerText = '00:00';
  const icon = document.getElementById('timer-icon');
  if (icon) icon.setAttribute('data-lucide', 'play');
  if (window.lucide) lucide.createIcons();
}

// ----------------- AI MARKETING CHAT (Interactive) -----------------
function sendAIChat(e) {
  e.preventDefault();
  const input = document.getElementById('ai-chat-input');
  const query = input.value.trim();
  if (!query) return;

  const box = document.getElementById('ai-chat-box');

  // Append User message
  box.innerHTML += `
    <div class="flex items-start justify-end gap-2.5">
      <div class="bg-purple-600/30 border border-purple-500/40 p-3 rounded-2xl rounded-tr-sm text-slate-100 max-w-lg">
        ${query}
      </div>
      <div class="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">G</div>
    </div>
  `;
  input.value = '';
  box.scrollTop = box.scrollHeight;

  // Simulate intelligent response
  setTimeout(() => {
    let responseText = '';
    const qLower = query.toLowerCase();

    if (qLower.includes('roas') || qLower.includes('retorno')) {
      responseText = `O ROAS atual de 3,85x significa que para cada R$ 1,00 investido, a agência gerou R$ 3,85 em vendas. Na apresentação ao cliente, destaque que o ponto de equilíbrio costuma ser 2,0x, logo sua operação está gerando lucro líquido expressivo!`;
    } else if (qLower.includes('cpc') || qLower.includes('clique')) {
      responseText = `Seu CPC médio está em R$ 1,32 (-8,7% menor). Para manter o CPC baixo no Google Ads, aumente o Índice de Qualidade das palavras-chave e teste títulos mais focados no benefício direto.`;
    } else if (qLower.includes('ctr') || qLower.includes('cliques')) {
      responseText = `O CTR consolidado de 5,21% está excelente (a média de mercado é 2% a 3%). Isso valida que a imagem e a copy chamaram atenção no feed do Meta Ads.`;
    } else {
      responseText = `Com base nas métricas atuais: CTR 5,21%, CPC R$ 1,32 e ROAS 3,85x, o cenário é favorável para expandir o investimento em 20% no Meta Ads e gerar o relatório em PDF com a marca da agência.`;
    }

    box.innerHTML += `
      <div class="flex items-start gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0 font-bold text-[10px]">IA</div>
        <div class="bg-[#161D31] p-3 rounded-2xl rounded-tl-sm text-slate-200 max-w-lg leading-relaxed">
          ${responseText}
        </div>
      </div>
    `;
    box.scrollTop = box.scrollHeight;
  }, 600);
}

// ----------------- FILTERS & MODALS -----------------
function applyFilters() {
  const select = document.getElementById('filter-client');
  if (select) state.selectedClient = select.value;
  loadKPIs();
  loadCampaigns();
}

function filterCampaignsTable() {
  const search = document.getElementById('campaign-search-input').value.toLowerCase();
  const platform = document.getElementById('filter-campaigns-platform').value;
  const status = document.getElementById('filter-campaigns-status').value;

  const filtered = state.campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search) || (c.client_name && c.client_name.toLowerCase().includes(search));
    const matchPlatform = platform === 'all' || c.platform === platform;
    const matchStatus = status === 'all' || c.status === status;
    return matchSearch && matchPlatform && matchStatus;
  });

  const tbody = document.getElementById('all-campaigns-tbody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" class="py-6 text-center text-slate-500">Nenhuma campanha encontrada com os filtros selecionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(c => `
    <tr class="hover:bg-[#141A2E]/60 transition-colors">
      <td class="py-3 px-4">
        <span class="font-semibold text-white block">${c.name}</span>
        <span class="text-[10px] text-slate-400">${c.client_name || 'Geral'}</span>
      </td>
      <td class="py-3 px-4 text-slate-300 font-medium">${c.platform}</td>
      <td class="py-3 px-4 text-slate-300 font-mono">${c.impressions.toLocaleString('pt-BR')}</td>
      <td class="py-3 px-4 text-slate-300 font-mono">${c.clicks.toLocaleString('pt-BR')}</td>
      <td class="py-3 px-4 text-slate-300 font-mono">R$ ${c.investment.toFixed(2)}</td>
      <td class="py-3 px-4 text-slate-300 font-mono">R$ ${c.revenue.toFixed(2)}</td>
      <td class="py-3 px-4 font-bold text-purple-400 font-mono">${c.ctr.toFixed(2)}%</td>
      <td class="py-3 px-4 font-bold text-cyan-400 font-mono">R$ ${c.cpc.toFixed(2)}</td>
      <td class="py-3 px-4 font-semibold text-slate-400 font-mono">R$ ${c.cpm.toFixed(2)}</td>
      <td class="py-3 px-4 font-bold text-emerald-400 font-mono">${c.roas.toFixed(2)}x</td>
      <td class="py-3 px-4"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'Ativa' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}">${c.status}</span></td>
      <td class="py-3 px-4 text-right">
        <button onclick="deleteCampaign(${c.id})" class="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function toggleNotifications() {
  const box = document.getElementById('notification-box');
  if (box) box.classList.toggle('hidden');
}

function toggleUserDropdown() {
  // Toggle between Gabriel and Allan
  if (state.currentUser.name === 'Gabriel') {
    state.currentUser = { name: 'Allan', agency: 'Agência Alpha Digital', avatar: 'A' };
  } else {
    state.currentUser = { name: 'Gabriel', agency: 'Agência Alpha Digital', avatar: 'G' };
  }
  document.getElementById('user-name').innerText = state.currentUser.name;
  document.getElementById('user-avatar').innerText = state.currentUser.avatar;
}

function saveAgencySettings() {
  const name = document.getElementById('setting-agency-name').value;
  state.currentUser.agency = name;
  document.getElementById('user-agency').innerText = name;
  alert('Configurações da agência salvas com sucesso!');
}

function downloadAllAgencyData() {
  const exportData = {
    agency: state.currentUser.agency,
    exported_at: new Date().toISOString(),
    campaigns: state.campaigns,
    clients: state.clients,
    reports: state.reports
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tecmarketing_backup_dados_lgpd_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

function clearAllDataDemo() {
  if (confirm('Restaurar dados padrão de apresentação?')) {
    window.location.reload();
  }
}

function setupEventListeners() {
  // Close modals on clicking outside
  document.querySelectorAll('[id^="modal-"]').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}
