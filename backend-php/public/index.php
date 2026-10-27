<?php
declare(strict_types=1);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
header('Content-Type: application/json; charset=utf-8');

if ($uri === '/health') {
    echo json_encode(['status' => 'healthy', 'service' => 'document-payment integrations (not configured)']);
    exit;
}

// Do not issue contracts or receipts from client-supplied booking/payment data.
// These routes remain explicit 501 responses until backed by authenticated DB records.
if (($uri === '/api/v1/documents/generate-contract' && $method === 'POST') ||
    preg_match('#^/api/v1/documents/(?:contract|receipt)/[A-Za-z0-9_-]+$#', (string)$uri)) {
    http_response_code(501);
    echo json_encode(['error' => 'Document service is not configured for verified bookings']);
    exit;
}

if ($uri === '/api/v1/payments/webhook' && $method === 'POST') {
    http_response_code(501);
    echo json_encode(['error' => 'Payment provider integration is not configured']);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found']);
