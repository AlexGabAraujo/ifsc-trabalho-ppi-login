<?php
session_start();
header('Content-Type: application/json');

$userName = $_SESSION['user_name'] ?? 'Usuário';
$userProfile = $_SESSION['user_profile'] ?? 'comum'; // Default é 'comum'

echo json_encode([
    'success' => true,
    'userName' => $userName,
    'userProfile' => $userProfile
]);
?>