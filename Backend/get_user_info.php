<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

$userName = $_SESSION['user_name'] ?? 'Usuário';
$userProfile = $_SESSION['user_profile'] ?? 'comum';
$lastQuizScore = 0;

if (isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
    try {
        $stmt = $pdo->prepare("SELECT last_quiz_score FROM usuario WHERE id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            $lastQuizScore = $result['last_quiz_score'];
        }
    } catch (\PDOException $e) {
        error_log("Error fetching last quiz score: " . $e->getMessage());
    }
}


echo json_encode([
    'success' => true,
    'userName' => $userName,
    'userProfile' => $userProfile,
    'lastQuizScore' => $lastQuizScore
]);
?>