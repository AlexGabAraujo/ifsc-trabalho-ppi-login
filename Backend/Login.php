<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? '';
$senha = $data['password'] ?? '';

if (empty($email) || empty($senha)) {
    echo json_encode(['sucesso' => false, 'erro' => 'E-mail e senha são obrigatórios.']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, nome, senha, perfil FROM usuario WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($senha, $user['senha'])) {
        // Login sucesso
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['nome'];
        $_SESSION['user_profile'] = $user['perfil'];

        echo json_encode(['sucesso' => true, 'message' => 'Login realizado com sucesso!', 'perfil' => $user['perfil']]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'E-mail ou senha inválidos.']);
    }

} catch (\PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode(['sucesso' => false, 'erro' => 'Erro interno do servidor.']);
}
?>