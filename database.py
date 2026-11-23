import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'tecmarketing.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Table: Users / Agency Profile
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        agency_name TEXT NOT NULL,
        role TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'Profissional',
        monthly_price REAL DEFAULT 99.0,
        avatar TEXT DEFAULT 'G',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table: Clients
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        segment TEXT,
        contact_email TEXT,
        logo_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Table: Campaigns
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        name TEXT NOT NULL,
        platform TEXT NOT NULL, -- 'Meta Ads', 'Google Ads'
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        investment REAL NOT NULL DEFAULT 0.0,
        revenue REAL NOT NULL DEFAULT 0.0,
        ctr REAL NOT NULL DEFAULT 0.0,
        cpc REAL NOT NULL DEFAULT 0.0,
        cpm REAL NOT NULL DEFAULT 0.0,
        roas REAL NOT NULL DEFAULT 0.0,
        status TEXT NOT NULL DEFAULT 'Ativa', -- 'Ativa', 'Pausada', 'Concluída'
        start_date TEXT,
        end_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE SET NULL
    )
    ''')

    # Table: Reports
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        title TEXT NOT NULL,
        agency_name TEXT NOT NULL,
        period TEXT NOT NULL,
        kpis_json TEXT NOT NULL,
        ai_summary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients (id) ON DELETE CASCADE
    )
    ''')

    # Seed initial data if empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        cursor.execute('''
        INSERT INTO users (name, email, agency_name, role, plan, monthly_price, avatar)
        VALUES ('Gabriel Lucas', 'gabriel@tecmarketing.com.br', 'Agência Alpha Digital', 'Gestor de Tráfego', 'Profissional', 99.0, 'G')
        ''')
        cursor.execute('''
        INSERT INTO users (name, email, agency_name, role, plan, monthly_price, avatar)
        VALUES ('Allan Victor', 'allan@tecmarketing.com.br', 'Agência Alpha Digital', 'Desenvolvedor & Analista', 'Profissional', 99.0, 'A')
        ''')

    cursor.execute('SELECT COUNT(*) FROM clients')
    if cursor.fetchone()[0] == 0:
        clients_data = [
            ('Loja Virtual Express', 'E-commerce', 'contato@expressloja.com.br'),
            ('TechStore Pro', 'Tecnologia & Gadgets', 'marketing@techstorepro.com.br'),
            ('Clínica DentalMais', 'Saúde & Odontologia', 'dr.carlos@dentalmais.com.br'),
            ('Consultoria Silva & Filhos', 'B2B & Negócios', 'atendimento@consultoriasilva.com.br'),
            ('AutoPeças Silva', 'Automotivo', 'vendas@autopecassilva.com.br')
        ]
        cursor.executemany('''
        INSERT INTO clients (name, segment, contact_email) VALUES (?, ?, ?)
        ''', clients_data)

    cursor.execute('SELECT COUNT(*) FROM campaigns')
    if cursor.fetchone()[0] == 0:
        # Pre-seed matching Slide 12 metrics exactly:
        # 1. Lançamento - Produto X | Meta Ads | CTR 5,21% | CPC R$ 1,32 | ROAS 3,85x | Ativa
        # Impressions = 154200, Clicks = 8034 -> CTR = 5.21%
        # Investment = 10604.88, CPC = 1.32, CPM = (10604.88 / 154200) * 1000 = 68.77 or calibrated
        # In slide 12: Top KPIs are consolidated:
        # CTR: 5,21%, CPC: R$ 1,32, CPM: R$ 26,40, ROAS: 3,85x
        campaigns_data = [
            (1, 'Lançamento - Produto X', 'Meta Ads', 154200, 8034, 10604.88, 40828.78, 5.21, 1.32, 26.40, 3.85, 'Ativa', '2026-11-01', '2026-11-20'),
            (2, 'Vendas - Site', 'Google Ads', 89400, 4255, 6297.40, 20151.68, 4.76, 1.48, 29.80, 3.20, 'Ativa', '2026-11-05', '2026-11-20'),
            (3, 'Reconhecimento - Marca', 'Meta Ads', 72500, 2856, 4855.20, 10244.47, 3.94, 1.70, 24.10, 2.11, 'Pausada', '2026-10-15', '2026-11-10'),
            (1, 'Black Friday Antecipada', 'Meta Ads', 210000, 12915, 14852.25, 68320.35, 6.15, 1.15, 32.50, 4.60, 'Ativa', '2026-11-10', '2026-11-20'),
            (2, 'Tráfego Fundo de Funil', 'Google Ads', 65400, 3793, 7396.35, 28845.76, 5.80, 1.95, 35.00, 3.90, 'Ativa', '2026-11-08', '2026-11-20'),
            (4, 'Captação de Leads Consultoria', 'Meta Ads', 48200, 1928, 2410.00, 7712.00, 4.00, 1.25, 25.00, 3.20, 'Ativa', '2026-11-02', '2026-11-18'),
            (5, 'Remarketing Institucional', 'Google Ads', 34100, 1432, 2148.00, 5370.00, 4.20, 1.50, 31.50, 2.50, 'Pausada', '2026-10-20', '2026-11-15')
        ]
        cursor.executemany('''
        INSERT INTO campaigns (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', campaigns_data)

    cursor.execute('SELECT COUNT(*) FROM reports')
    if cursor.fetchone()[0] == 0:
        sample_kpis = json.dumps({
            "ctr": "5,21%",
            "cpc": "R$ 1,32",
            "cpm": "R$ 26,40",
            "roas": "3,85x",
            "impressoes": 154200,
            "cliques": 8034,
            "investimento": "R$ 10.604,88",
            "receita": "R$ 40.828,78"
        })
        cursor.execute('''
        INSERT INTO reports (client_id, title, agency_name, period, kpis_json, ai_summary)
        VALUES (1, 'Relatório Mensal de Performance - Q4', 'Agência Alpha Digital', 'Últimos 30 dias', ?, 'Sua campanha apresentou um aumento de 12,4% no CTR e um ROAS de 3,85x, indicando um excelente retorno sobre o investimento. O CPC médio foi de R$ 1,32, superando as metas de eficiência.')
        ''', (sample_kpis,))

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()
