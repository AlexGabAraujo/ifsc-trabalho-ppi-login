<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$confirmation = $data['confirm'] ?? '';

if ($confirmation !== 'EXCLUIR') {
    echo json_encode(['success' => false, 'message' => 'Confirmação incorreta.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    // deletar do db
    $stmt = $pdo->prepare("DELETE FROM usuario WHERE id = ?");
    $stmt->execute([$userId]);

    // quebrar sessao
    session_unset();
    session_destroy();

    echo json_encode(['success' => true, 'message' => 'Conta excluída com sucesso.']);

} catch (\PDOException $e) {
    error_log("Account deletion error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro ao excluir conta. Por favor, tente novamente mais tarde.']);
}
?>