<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Usuário não autenticado.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$userId = $_SESSION['user_id'];
$nome = $data['nome'] ?? null;
$email = $data['email'] ?? null;
$telefone = $data['telefone'] ?? null;
$dataNasc = $data['dataNasc'] ?? null;

if (empty($nome) || empty($email) || empty($dataNasc)) {
    echo json_encode(['success' => false, 'message' => 'Nome, e-mail e data de nascimento são obrigatórios.']);
    exit();
}

// validaçar enmail
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.']);
    exit();
}

try {
    // Verificar se o e-mail já está em uso por outro usuário
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuario WHERE email = ? AND id != ?");
    $stmt->execute([$email, $userId]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Este e-mail já está em uso por outra conta.']);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE usuario SET nome = ?, email = ?, telefone = ?, data_nascimento = ? WHERE id = ?");
    $stmt->execute([$nome, $email, $telefone, $dataNasc, $userId]);

    // atualizar sessão
    $_SESSION['user_name'] = $nome;

    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso!']);

} catch (\PDOException $e) {
    error_log("Profile update error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar perfil. Por favor, tente novamente mais tarde.']);
}
?>