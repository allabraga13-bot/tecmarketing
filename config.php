<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL (cPanel)
 * TecMarketing Micro-SaaS
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'tecmarketing_db');   // Altere para o nome do seu banco criado no cPanel
define('DB_USER', 'tecmarketing_user'); // Altere para o seu usuário MySQL do cPanel
define('DB_PASS', 'SuaSenhaSegura123');  // Altere para a senha do seu usuário MySQL
define('DB_CHARSET', 'utf8mb4');

function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Falha na conexão com o banco de dados: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}
