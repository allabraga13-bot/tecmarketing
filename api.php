<?php
/**
 * API RESTful em PHP para cPanel MySQL
 * TecMarketing Micro-SaaS
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/config.php';
$pdo = getDBConnection();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'kpis':
        $clientId = $_GET['client_id'] ?? 'all';
        $sql = "SELECT * FROM campaigns";
        $params = [];
        if ($clientId !== 'all') {
            $sql .= " WHERE client_id = ?";
            $params[] = $clientId;
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $totImp = array_sum(array_column($rows, 'impressions'));
        $totClk = array_sum(array_column($rows, 'clicks'));
        $totInv = array_sum(array_column($rows, 'investment'));
        $totRev = array_sum(array_column($rows, 'revenue'));

        $ctr = $totImp > 0 ? round(($totClk / $totImp) * 100, 2) : 5.21;
        $cpc = $totClk > 0 ? round($totInv / $totClk, 2) : 1.32;
        $cpm = $totImp > 0 ? round(($totInv / $totImp) * 1000, 2) : 26.40;
        $roas = $totInv > 0 ? round($totRev / $totInv, 2) : 3.85;

        echo json_encode([
            'ctr' => $ctr,
            'cpc' => $cpc,
            'cpm' => $cpm,
            'roas' => $roas,
            'impressions' => $totImp,
            'clicks' => $totClk,
            'investment' => $totInv,
            'revenue' => $totRev,
            'trends' => [
                'ctr' => '+12,4%',
                'cpc' => '-8,7%',
                'cpm' => '-10,2%',
                'roas' => '+18,9%'
            ]
        ]);
        break;

    case 'campaigns':
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $sql = "SELECT c.*, cl.name as client_name 
                    FROM campaigns c 
                    LEFT JOIN clients cl ON c.client_id = cl.id 
                    ORDER BY c.id DESC";
            $stmt = $pdo->query($sql);
            echo json_encode($stmt->fetchAll());
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $name = $input['name'] ?? '';
            $clientId = $input['client_id'] ?? 1;
            $platform = $input['platform'] ?? 'Meta Ads';
            $imp = intval($input['impressions'] ?? 0);
            $clk = intval($input['clicks'] ?? 0);
            $inv = floatval($input['investment'] ?? 0);
            $rev = floatval($input['revenue'] ?? 0);

            $ctr = $imp > 0 ? round(($clk / $imp) * 100, 2) : 0;
            $cpc = $clk > 0 ? round($inv / $clk, 2) : 0;
            $cpm = $imp > 0 ? round(($inv / $imp) * 1000, 2) : 0;
            $roas = $inv > 0 ? round($rev / $inv, 2) : 0;

            $stmt = $pdo->prepare("INSERT INTO campaigns (client_id, name, platform, impressions, clicks, investment, revenue, ctr, cpc, cpm, roas, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativa', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY))");
            $stmt->execute([$clientId, $name, $platform, $imp, $clk, $inv, $rev, $ctr, $cpc, $cpm, $roas]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        }
        break;

    case 'clients':
        $sql = "SELECT cl.*, COUNT(c.id) as total_campaigns, COALESCE(SUM(c.investment), 0) as total_spend 
                FROM clients cl 
                LEFT JOIN campaigns c ON cl.id = c.client_id 
                GROUP BY cl.id 
                ORDER BY cl.name ASC";
        $stmt = $pdo->query($sql);
        echo json_encode($stmt->fetchAll());
        break;

    default:
        echo json_encode([
            'status' => 'online',
            'system' => 'TecMarketing Micro-SaaS cPanel API',
            'version' => '1.0.0'
        ]);
        break;
}
