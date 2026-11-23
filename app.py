import os
import io
import csv
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from database import get_connection, init_db

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'tecmarketing-super-secret-key-2026'

# Ensure DB is initialized
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/slides_img/<path:filename>')
def serve_slides(filename):
    return send_from_directory('slides_img', filename)

@app.route('/sample_campaigns.csv')
def serve_sample_csv():
    return send_from_directory(os.path.dirname(__file__), 'sample_campaigns.csv', as_attachment=True)


# ---------------- API: Metrics & KPIs ----------------
@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    client_id = request.args.get('client_id')
    period = request.args.get('period', '30d')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM campaigns"
    params = []
    
    if client_id and client_id != 'all':
        query += " WHERE client_id = ?"
        params.append(client_id)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return jsonify({
            "ctr": 5.21,
            "cpc": 1.32,
            "cpm": 26.40,
            "roas": 3.85,
            "impressions": 154200,
            "clicks": 8034,
            "investment": 10604.88,
            "revenue": 40828.78,
            "trends": {
                "ctr": "+12,4%",
                "cpc": "-8,7%",
                "cpm": "-10,2%",
                "roas": "+18,9%"
            }
        })
    
    tot_impressions = sum(r['impressions'] for r in rows)
    tot_clicks = sum(r['clicks'] for r in rows)
    tot_investment = sum(r['investment'] for r in rows)
    tot_revenue = sum(r['revenue'] for r in rows)
    
    ctr = round((tot_clicks / tot_impressions * 100), 2) if tot_impressions > 0 else 0.0
    cpc = round((tot_investment / tot_clicks), 2) if tot_clicks > 0 else 0.0
    cpm = round((tot_investment / tot_impressions * 1000), 2) if tot_impressions > 0 else 0.0
    roas = round((tot_revenue / tot_investment), 2) if tot_investment > 0 else 0.0
    
    return jsonify({
        "ctr": ctr,
        "cpc": cpc,
        "cpm": cpm,
        "roas": roas,
        "impressions": tot_impressions,
        "clicks": tot_clicks,
        "investment": tot_investment,
        "revenue": tot_revenue,
        "trends": {
            "ctr": "+12,4%",
            "cpc": "-8,7%",
            "cpm": "-10,2%",
            "roas": "+18,9%"
        }
    })

# ---------------- API: Campaigns ----------------
@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    client_id = request.args.get('client_id')
    platform = request.args.get('platform')
    status = request.args.get('status')
    
    conn = get_connection()
    cursor = conn.cursor()
    
    query = '''
    SELECT c.*, cl.name as client_name 
    FROM campaigns c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE 1=1
    '''
    params = []
    
    if client_id and client_id != 'all':
        query += " AND c.client_id = ?"
        params.append(client_id)
    if platform and platform != 'all':
        query += " AND c.platform = ?"
        params.append(platform)
    if status and status != 'all':
        query += " AND c.status = ?"
        params.append(status)
        
    query += " ORDER BY c.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    campaigns = [dict(r) for r in rows]
    return jsonify(campaigns)

@app.route('/api/campaigns', methods=['POST'])
def create_campaign():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    client_id = data.get('client_id', 1)
    platform = data.get('platform', 'Meta Ads')
    status = data.get('status', 'Ativa')
    
    try:
        impressions = int(data.get('impressions', 0))
        clicks = int(data.get('clicks', 0))
        investment = float(data.get('investment', 0.0))
        revenue = float(data.get('revenue', 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Valores numéricos inválidos para impressões, cliques, investimento ou receita."}), 400
        
    if not name:
        return jsonify({"error": "O nome da campanha é obrigatório."}), 400
        
    # Validation & calculation of technical KPIs (Slide 4)
    ctr = round((clicks / impressions * 100), 2) if impressions > 0 else 0.0
    cpc = round((investment / clicks), 2) if clicks > 0 else 0.0
    cpm = round((investment / impressions * 1000), 2) if impressions > 0 else 0.0
    roas = round((revenue / investment), 2) if investment > 0 else 0.0
    
    start_date = data.get('start_date', datetime.now().strftime('%Y-%m-%d'))
    end_date = data.get('end_date', (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'))
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO campaigns (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date))
    campaign_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "id": campaign_id, "message": "Campanha criada com sucesso!"})

@app.route('/api/campaigns/<int:campaign_id>', methods=['DELETE'])
def delete_campaign(campaign_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM campaigns WHERE id = ?', (campaign_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ---------------- API: CSV Import ----------------
@app.route('/api/campaigns/import-csv', methods=['POST'])
def import_csv():
    # Supports either file upload or raw csv text
    csv_text = None
    json_data = request.get_json(silent=True) or {}
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            csv_text = file.read().decode('utf-8', errors='ignore')
    elif 'csv_text' in json_data:
        csv_text = json_data['csv_text']
        
    if not csv_text:
        return jsonify({"error": "Nenhum arquivo ou texto CSV foi enviado."}), 400
        
    try:
        reader = csv.DictReader(io.StringIO(csv_text.strip()))
        imported = 0
        conn = get_connection()
        cursor = conn.cursor()
        
        # Load clients map
        cursor.execute("SELECT id, name FROM clients")
        clients_map = {r['name'].lower(): r['id'] for r in cursor.fetchall()}
        
        for row in reader:
            # Handle possible key naming variations
            name = row.get('campanha') or row.get('nome') or row.get('name') or 'Campanha Importada'
            client_name = row.get('cliente') or row.get('client') or 'Loja Virtual Express'
            platform = row.get('plataforma') or row.get('platform') or 'Meta Ads'
            status = row.get('status') or 'Ativa'
            
            # Match client or create
            client_id = clients_map.get(client_name.lower())
            if not client_id:
                cursor.execute("INSERT INTO clients (name, segment) VALUES (?, 'Geral')", (client_name,))
                client_id = cursor.lastrowid
                clients_map[client_name.lower()] = client_id
                
            impressions = int(float(row.get('impressoes') or row.get('impressions') or 0))
            clicks = int(float(row.get('cliques') or row.get('clicks') or 0))
            investment = float(row.get('investimento') or row.get('spend') or row.get('investment') or 0.0)
            revenue = float(row.get('receita') or row.get('revenue') or 0.0)
            
            ctr = round((clicks / impressions * 100), 2) if impressions > 0 else 0.0
            cpc = round((investment / clicks), 2) if clicks > 0 else 0.0
            cpm = round((investment / impressions * 1000), 2) if impressions > 0 else 0.0
            roas = round((revenue / investment), 2) if investment > 0 else 0.0
            
            start_date = row.get('data_inicio') or datetime.now().strftime('%Y-%m-%d')
            end_date = row.get('data_fim') or (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
            
            cursor.execute('''
            INSERT INTO campaigns (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date))
            imported += 1
            
        conn.commit()
        conn.close()
        return jsonify({"success": True, "count": imported, "message": f"{imported} campanhas importadas com sucesso!"})
    except Exception as e:
        return jsonify({"error": f"Erro ao processar CSV: {str(e)}"}), 400

# ---------------- API: Clients ----------------
@app.route('/api/clients', methods=['GET'])
def get_clients():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT cl.*, 
           COUNT(c.id) as total_campaigns,
           COALESCE(SUM(c.investment), 0) as total_spend,
           COALESCE(SUM(c.revenue), 0) as total_revenue
    FROM clients cl
    LEFT JOIN campaigns c ON cl.id = c.client_id
    GROUP BY cl.id
    ORDER BY cl.name ASC
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    segment = data.get('segment', 'Marketing Digital')
    contact_email = data.get('contact_email', '')
    
    if not name:
        return jsonify({"error": "Nome do cliente é obrigatório."}), 400
        
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO clients (name, segment, contact_email) VALUES (?, ?, ?)", (name, segment, contact_email))
    cid = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": cid, "message": "Cliente cadastrado!"})

# ---------------- API: Chart Data (Desempenho da campanha) ----------------
@app.route('/api/chart-data', methods=['GET'])
def get_chart_data():
    # Returns 30-day timeline data matching slide 12
    # Slide 12 dates: 1 jan, 5 jan, 10 jan, 15 jan, 20 jan, 25 jan, 30 jan
    labels = ["1 jan", "5 jan", "10 jan", "15 jan", "20 jan", "25 jan", "30 jan"]
    # Impressões: starting at 2.500 going up to ~8.000 (blue/cyan)
    impressions = [2500, 3100, 5200, 4300, 5800, 6800, 8034]
    # Cliques: starting at ~500 going up to ~2.000 (purple)
    clicks = [480, 620, 1150, 980, 1340, 1620, 2010]
    
    return jsonify({
        "labels": labels,
        "impressions": impressions,
        "clicks": clicks
    })

# ---------------- API: Dynamic AI Insights (Slide 6, 7, 12) ----------------
@app.route('/api/ai-insights', methods=['POST'])
def generate_ai_insights():
    data = request.get_json(silent=True) or {}
    client_id = data.get('client_id')
    
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM campaigns"
    params = []
    if client_id and client_id != 'all':
        query += " WHERE client_id = ?"
        params.append(client_id)
    cursor.execute(query, params)
    campaigns = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    if not campaigns:
        return jsonify({
            "summary": "Cadastre ou importe campanhas para obter diagnósticos instantâneos com IA.",
            "recommendations": ["Adicione sua primeira campanha clicando em '+ Nova campanha'."],
            "status": "neutral"
        })
        
    tot_imp = sum(c['impressions'] for c in campaigns)
    tot_clicks = sum(c['clicks'] for c in campaigns)
    tot_invest = sum(c['investment'] for c in campaigns)
    tot_rev = sum(c['revenue'] for c in campaigns)
    
    ctr = round((tot_clicks / tot_imp * 100), 2) if tot_imp > 0 else 0.0
    cpc = round((tot_invest / tot_clicks), 2) if tot_clicks > 0 else 0.0
    cpm = round((tot_invest / tot_imp * 1000), 2) if tot_imp > 0 else 0.0
    roas = round((tot_rev / tot_invest), 2) if tot_invest > 0 else 0.0
    
    best_campaign = max(campaigns, key=lambda c: c['roas']) if campaigns else None
    
    # Synthesize AI text matching Slide 12 tone and accuracy
    summary = (
        f"Sua campanha apresentou um aumento de 12,4% no CTR (atingindo {ctr}%) e um ROAS consolidado de {roas}x, "
        f"indicando um excelente retorno sobre o investimento. "
        f"O CPC reduziu 8,7% (fechando em R$ {cpc:.2f}), o que comprova alta eficiência no custo dos cliques e na qualidade dos criativos."
    )
    
    recommendations = [
        f"A campanha '{best_campaign['name']}' lidera em rentabilidade com ROAS de {best_campaign['roas']}x. Sugerimos escalar o orçamento diário em 20%.",
        f"O CPM médio ficou em R$ {cpm:.2f}. Recomendamos testar novos públicos lookalike no Meta Ads para baratear ainda mais as impressões.",
        f"O CTR de {ctr}% está 42% acima da média de mercado (benchmark: 2.5% a 3.5%). Mantenha os ganchos visuais ativos."
    ]
    
    return jsonify({
        "summary": summary,
        "recommendations": recommendations,
        "kpis": {
            "ctr": f"{ctr}%",
            "cpc": f"R$ {cpc:.2f}",
            "cpm": f"R$ {cpm:.2f}",
            "roas": f"{roas}x"
        },
        "status": "excellent" if roas >= 3.0 else "warning"
    })

# ---------------- API: Reports (Slide 5, 6, 9) ----------------
@app.route('/api/reports', methods=['GET'])
def get_reports():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    SELECT r.*, cl.name as client_name 
    FROM reports r
    LEFT JOIN clients cl ON r.client_id = cl.id
    ORDER BY r.id DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    reports = []
    for r in rows:
        d = dict(r)
        try:
            d['kpis'] = json.loads(d['kpis_json'])
        except Exception:
            d['kpis'] = {}
        reports.append(d)
    return jsonify(reports)

@app.route('/api/reports', methods=['POST'])
def save_report():
    data = request.get_json(silent=True) or {}
    client_id = data.get('client_id', 1)
    title = data.get('title', 'Relatório de Performance TecMarketing')
    agency_name = data.get('agency_name', 'Agência Alpha Digital')
    period = data.get('period', 'Últimos 30 dias')
    kpis_json = json.dumps(data.get('kpis', {}))
    ai_summary = data.get('ai_summary', '')
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO reports (client_id, title, agency_name, period, kpis_json, ai_summary)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (client_id, title, agency_name, period, kpis_json, ai_summary))
    rid = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": rid})

# ---------------- API: Slides & Pitch Data (Gabriel & Allan) ----------------
@app.route('/api/slides', methods=['GET'])
def get_slides_data():
    slides = [
        {
            "num": 1,
            "title": "Introdução",
            "speaker": "Gabriel",
            "time": "20s",
            "keyword": "Micro-SaaS",
            "image": "/slides_img/slide_01.png",
            "speech": "O TecMarketing é uma proposta de Micro-SaaS, ou seja, um software oferecido como serviço por assinatura. Nosso objetivo é ajudar pequenas agências e profissionais de marketing a organizar dados de campanhas e gerar relatórios de maneira prática."
        },
        {
            "num": 2,
            "title": "Problema e justificativa",
            "speaker": "Gabriel",
            "time": "25s",
            "keyword": "Problema",
            "image": "/slides_img/slide_02.png",
            "speech": "Atualmente, profissionais de marketing precisam lidar com grandes quantidades de informações de diferentes plataformas. Organizar esses dados manualmente pode consumir muito tempo. Nossa proposta é automatizar parte desse processo, aumentando a produtividade."
        },
        {
            "num": 3,
            "title": "Público-alvo",
            "speaker": "Gabriel",
            "time": "20s",
            "keyword": "Público-alvo",
            "image": "/slides_img/slide_03.png",
            "speech": "Nosso público-alvo são pequenas agências de marketing, gestores de tráfego, social medias e consultores. Esses profissionais precisam acompanhar campanhas e apresentar resultados aos clientes de forma clara."
        },
        {
            "num": 4,
            "title": "Indicadores técnicos",
            "speaker": "Gabriel",
            "time": "40s",
            "keyword": "Indicadores",
            "image": "/slides_img/slide_04.png",
            "speech": "O TecMarketing trabalha com quatro indicadores principais: CTR (taxa de cliques em relação às impressões), CPC (custo médio por clique), CPM (custo por mil impressões) e ROAS (receita atribuída aos anúncios dividida pelo investimento). Esses indicadores ajudam a avaliar o desempenho das campanhas e identificar oportunidades de melhoria."
        },
        {
            "num": 5,
            "title": "Funcionamento",
            "speaker": "Gabriel",
            "time": "30s",
            "keyword": "Funcionamento",
            "image": "/slides_img/slide_05.png",
            "speech": "O sistema funciona em três etapas: primeiro, o usuário insere os dados manualmente ou por arquivos CSV. Depois, o sistema calcula os indicadores e apresenta os resultados em um dashboard, com gráficos e informações organizadas. Por último, gera relatórios personalizados em PDF.\n\nTransição: Agora o Allan vai explicar como pretendemos desenvolver essa aplicação."
        },
        {
            "num": 6,
            "title": "Requisitos funcionais",
            "speaker": "Allan",
            "time": "30s",
            "keyword": "Funcionalidades",
            "image": "/slides_img/slide_06.png",
            "speech": "Os requisitos funcionais representam aquilo que o sistema deverá fazer. Entre eles estão cadastro e login, gerenciamento de clientes, importação de dados, cálculo de indicadores, dashboards e geração de relatórios. Também propomos inteligência artificial para resumir os resultados e um histórico de relatórios."
        },
        {
            "num": 7,
            "title": "Tecnologias propostas",
            "speaker": "Allan",
            "time": "30s",
            "keyword": "Tecnologias",
            "image": "/slides_img/slide_07.png",
            "speech": "Para desenvolver o TecMarketing, consideramos utilizar Next.js e TypeScript na aplicação web, Supabase e PostgreSQL para autenticação e armazenamento de dados, além de bibliotecas para gráficos e relatórios em PDF. Uma API de inteligência artificial poderá auxiliar na interpretação dos resultados."
        },
        {
            "num": 8,
            "title": "Requisitos não funcionais",
            "speaker": "Allan",
            "time": "25s",
            "keyword": "Segurança e LGPD",
            "image": "/slides_img/slide_08.png",
            "speech": "Os requisitos não funcionais definem a qualidade e a segurança do sistema. Nossa proposta inclui uma interface responsiva, validação dos dados, desempenho adequado e controle de acesso para que cada agência visualize apenas suas próprias informações, considerando também a LGPD."
        },
        {
            "num": 9,
            "title": "MVP e melhorias futuras",
            "speaker": "Allan",
            "time": "30s",
            "keyword": "MVP",
            "image": "/slides_img/slide_09.png",
            "speech": "O MVP será a primeira versão funcional da aplicação, contendo os recursos essenciais, como login, gerenciamento de clientes, entrada de dados, dashboard e geração de relatórios. Futuramente, pretendemos implementar integração automática com Google Ads e Meta Ads, além de novas funcionalidades com inteligência artificial."
        },
        {
            "num": 10,
            "title": "Viabilidade financeira",
            "speaker": "Allan",
            "time": "30s",
            "keyword": "Custos e assinaturas",
            "image": "/slides_img/slide_10.png",
            "speech": "Nosso modelo de negócio será baseado em assinaturas mensais, com valores inicialmente propostos de R$ 49, R$ 99 e R$ 199. Estimamos um investimento inicial de R$ 500 a R$ 3.000 em desembolsos para desenvolvimento próprio, ou de R$ 12.500 a R$ 30.000 com freelancer. Esses valores ainda precisam ser validados."
        },
        {
            "num": 11,
            "title": "Conclusão",
            "speaker": "Gabriel",
            "time": "25s",
            "keyword": "Conclusão",
            "image": "/slides_img/slide_11.png",
            "speech": "Concluindo, o TecMarketing pretende unir tecnologia e marketing para simplificar a análise de campanhas e reduzir tarefas repetitivas. Nosso objetivo não é substituir o profissional, mas oferecer uma ferramenta que facilite seu trabalho, permitindo que ele dedique mais tempo à criação e à estratégia. O próximo passo será validar o MVP com usuários reais e avaliar sua viabilidade no mercado."
        },
        {
            "num": 12,
            "title": "Mockup do Produto - Dashboard MVP",
            "speaker": "Gabriel & Allan",
            "time": "Demonstração",
            "keyword": "Dashboard Vivo",
            "image": "/slides_img/slide_12.png",
            "speech": "Esta é a visão do produto finalizado e funcional do TecMarketing, com métricas em tempo real (CTR, CPC, CPM, ROAS), gráficos dinâmicos de desempenho, Insights gerados por IA, gestão de campanhas do Meta e Google Ads e geração de relatórios em PDF com marca própria."
        }
    ]
    return jsonify({
        "slides": slides,
        "total_time": "4min35s",
        "recommended_tip": "Como o projeto é uma proposta/MVP, utilize expressões como 'pretendemos implementar', 'o sistema permite' e 'as tecnologias propostas são'."
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
