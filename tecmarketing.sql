-- ========================================================
-- TECMARKETING MICRO-SAAS — BANCO DE DADOS MYSQL / MARIADB
-- Compatível com phpMyAdmin e cPanel MySQL
-- Autores: Gabriel Lucas da Silva Oliveira & Allan Victor Braga Dias
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 1. Tabela: `users` (Usuários e Agências)
--
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `agency_name` varchar(150) NOT NULL DEFAULT 'Agência Alpha Digital',
  `role` varchar(100) NOT NULL DEFAULT 'Gestor de Tráfego',
  `plan` enum('Entrada','Profissional','Avançado') NOT NULL DEFAULT 'Profissional',
  `monthly_price` decimal(10,2) NOT NULL DEFAULT 99.00,
  `avatar` varchar(10) NOT NULL DEFAULT 'G',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dados iniciais para `users`
--
INSERT INTO `users` (`id`, `name`, `email`, `agency_name`, `role`, `plan`, `monthly_price`, `avatar`) VALUES
(1, 'Gabriel Lucas da Silva Oliveira', 'gabriel@tecmarketing.com.br', 'Agência Alpha Digital', 'Gestor de Tráfego', 'Profissional', 99.00, 'G'),
(2, 'Allan Victor Braga Dias', 'allan@tecmarketing.com.br', 'Agência Alpha Digital', 'Desenvolvedor & Analista', 'Profissional', 99.00, 'A');

-- --------------------------------------------------------

--
-- 2. Tabela: `clients` (Carteira de Clientes da Agência)
--
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT 1,
  `name` varchar(150) NOT NULL,
  `segment` varchar(100) DEFAULT 'Marketing Digital',
  `contact_email` varchar(191) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_clients_user` (`user_id`),
  CONSTRAINT `fk_clients_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dados iniciais para `clients`
--
INSERT INTO `clients` (`id`, `user_id`, `name`, `segment`, `contact_email`, `phone`) VALUES
(1, 1, 'Loja Virtual Express', 'E-commerce', 'contato@expressloja.com.br', '(11) 98765-4321'),
(2, 1, 'TechStore Pro', 'Tecnologia & Gadgets', 'marketing@techstorepro.com.br', '(21) 99887-1122'),
(3, 1, 'Clínica DentalMais', 'Saúde & Odontologia', 'dr.carlos@dentalmais.com.br', '(31) 97766-3344'),
(4, 1, 'Consultoria Silva & Filhos', 'B2B & Negócios', 'atendimento@consultoriasilva.com.br', '(41) 99123-4567'),
(5, 1, 'AutoPeças Silva', 'Automotivo', 'vendas@autopecassilva.com.br', '(51) 98833-2211');

-- --------------------------------------------------------

--
-- 3. Tabela: `campaigns` (Campanhas Publicitárias e Indicadores Técnicos)
--
DROP TABLE IF EXISTS `campaigns`;
CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `platform` enum('Meta Ads','Google Ads','TikTok Ads') NOT NULL DEFAULT 'Meta Ads',
  `impressions` int(11) NOT NULL DEFAULT 0,
  `clicks` int(11) NOT NULL DEFAULT 0,
  `investment` decimal(12,2) NOT NULL DEFAULT 0.00,
  `revenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  `ctr` decimal(6,2) NOT NULL DEFAULT 0.00 COMMENT 'Taxa de Cliques (Cliques / Impressoes * 100)',
  `cpc` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Custo por Clique (Investimento / Cliques)',
  `cpm` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Custo por Mil Impressoes (Investimento / Impressoes * 1000)',
  `roas` decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'Retorno sobre Investimento (Receita / Investimento)',
  `status` enum('Ativa','Pausada','Concluída') NOT NULL DEFAULT 'Ativa',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_campaigns_client` (`client_id`),
  CONSTRAINT `fk_campaigns_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dados iniciais para `campaigns` (Mockup Slide 12)
--
INSERT INTO `campaigns` (`id`, `client_id`, `name`, `platform`, `impressions`, `clicks`, `investment`, `revenue`, `ctr`, `cpc`, `cpm`, `roas`, `status`, `start_date`, `end_date`) VALUES
(1, 1, 'Lançamento - Produto X', 'Meta Ads', 154200, 8034, 10604.88, 40828.78, 5.21, 1.32, 26.40, 3.85, 'Ativa', '2026-11-01', '2026-11-20'),
(2, 2, 'Vendas - Site', 'Google Ads', 89400, 4255, 6297.40, 20151.68, 4.76, 1.48, 29.80, 3.20, 'Ativa', '2026-11-05', '2026-11-20'),
(3, 3, 'Reconhecimento - Marca', 'Meta Ads', 72500, 2856, 4855.20, 10244.47, 3.94, 1.70, 24.10, 2.11, 'Pausada', '2026-10-15', '2026-11-10'),
(4, 1, 'Black Friday Antecipada', 'Meta Ads', 210000, 12915, 14852.25, 68320.35, 6.15, 1.15, 32.50, 4.60, 'Ativa', '2026-11-10', '2026-11-20'),
(5, 2, 'Tráfego Fundo de Funil', 'Google Ads', 65400, 3793, 7396.35, 28845.76, 5.80, 1.95, 35.00, 3.90, 'Ativa', '2026-11-08', '2026-11-20'),
(6, 4, 'Captação de Leads Consultoria', 'Meta Ads', 48200, 1928, 2410.00, 7712.00, 4.00, 1.25, 25.00, 3.20, 'Ativa', '2026-11-02', '2026-11-18'),
(7, 5, 'Remarketing Institucional', 'Google Ads', 34100, 1432, 2148.00, 5370.00, 4.20, 1.50, 31.50, 2.50, 'Pausada', '2026-10-20', '2026-11-15');

-- --------------------------------------------------------

--
-- 4. Tabela: `reports` (Histórico de Relatórios em PDF Gerados)
--
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `agency_name` varchar(150) NOT NULL DEFAULT 'Agência Alpha Digital',
  `period` varchar(100) NOT NULL DEFAULT 'Últimos 30 dias',
  `kpis_json` text DEFAULT NULL,
  `ai_summary` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_reports_client` (`client_id`),
  CONSTRAINT `fk_reports_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dados iniciais para `reports`
--
INSERT INTO `reports` (`id`, `client_id`, `title`, `agency_name`, `period`, `kpis_json`, `ai_summary`) VALUES
(1, 1, 'Relatório Mensal de Performance - Q4', 'Agência Alpha Digital', 'Últimos 30 dias', '{\"ctr\": \"5,21%\", \"cpc\": \"R$ 1,32\", \"cpm\": \"R$ 26,40\", \"roas\": \"3,85x\", \"impressoes\": 154200, \"cliques\": 8034, \"investimento\": \"R$ 10.604,88\", \"receita\": \"R$ 40.828,78\"}', 'Sua campanha apresentou um aumento de 12,4% no CTR e um ROAS de 3,85x, indicando um excelente retorno sobre o investimento. O CPC médio foi de R$ 1,32, superando as metas de eficiência.');

-- --------------------------------------------------------

--
-- 5. Tabela: `ai_insights_cache` (Histórico de Insights da Inteligência Artificial)
--
DROP TABLE IF EXISTS `ai_insights_cache`;
CREATE TABLE `ai_insights_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) DEFAULT NULL,
  `summary` text NOT NULL,
  `recommendations_json` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'excellent',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ai_insights_cache` (`id`, `client_id`, `summary`, `recommendations_json`, `status`) VALUES
(1, 1, 'Sua campanha apresentou um aumento de 12,4% no CTR e um ROAS consolidado de 3,85x, indicando um excelente retorno sobre o investimento. O CPC reduziu 8,7% (fechando em R$ 1,32), o que comprova alta eficiência no custo dos cliques e na qualidade dos criativos.', '[\"A campanha Lançamento - Produto X lidera em rentabilidade com ROAS de 3.85x. Sugerimos escalar o orçamento diário em 20%.\", \"O CPM médio ficou em R$ 26,40. Recomendamos testar novos públicos lookalike no Meta Ads para baratear ainda mais as impressões.\", \"O CTR de 5,21% está 42% acima da média de mercado (benchmark: 2.5% a 3.5%). Mantenha os ganchos visuais ativos.\"]', 'excellent');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
