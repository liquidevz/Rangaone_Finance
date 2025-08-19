<?php
// Simple webhook to trigger deployment
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true);
    
    if ($payload && isset($payload['repository'])) {
        // Log the deployment
        file_put_contents('/tmp/deploy.log', date('Y-m-d H:i:s') . " - Deployment triggered\n", FILE_APPEND);
        
        // Run deployment script with environment variables
        $output = shell_exec('cd /home/rangaone/htdocs/www.rangaone.finance/rangaone-fe && cp .env.production .env.local && bash deploy-manual.sh 2>&1');
        
        // Log output
        file_put_contents('/tmp/deploy.log', $output . "\n", FILE_APPEND);
        
        http_response_code(200);
        echo json_encode(['status' => 'success', 'message' => 'Deployment triggered']);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}
?>