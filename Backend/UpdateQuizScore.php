<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);
$score = $data['score'] ?? null;

if (!is_numeric($score) || $score < 0 || $score > 100) {
    echo json_encode(['success' => false, 'message' => 'Pontuação inválida.']);
    exit();
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("UPDATE usuario SET last_quiz_score = ? WHERE id = ?");
    $stmt->execute([$score, $userId]);

    echo json_encode(['success' => true, 'message' => 'Pontuação do quiz atualizada com sucesso!']);

} catch (\PDOException $e) {
    error_log("Quiz score update error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar a pontuação do quiz.']);
}
?>