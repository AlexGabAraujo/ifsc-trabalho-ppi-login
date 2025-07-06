<?php
header('Content-Type: application/json');
require 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$nome = $data['nome'] ?? '';
$dataNascimento = $data['dataNascimento'] ?? '';
$telefone = $data['telefone'] ?? '';
$email = $data['email'] ?? '';
$senha = $data['senha'] ?? '';
$perfil = $data['perfil'] ?? 'comum';

if (empty($nome) || empty($dataNascimento) || empty($email) || empty($senha) || empty($perfil)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos obrigatórios devem ser preenchidos.']);
    exit();
}

// validações do email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.']);
    exit();
}

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

try {
    //ver se email já existe
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuario WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() > 0) {
        echo json_encode(['success' => false, 'message' => 'Este e-mail já está em uso.']);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO usuario (nome, data_nascimento, telefone, email, senha, perfil) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nome, $dataNascimento, $telefone, $email, $senhaHash, $perfil]);

    echo json_encode(['success' => true, 'message' => 'Cadastro realizado com sucesso!']);

} catch (\PDOException $e) {
    error_log("Registration error: " . $e->getMessage()); // Log the error for debugging
    echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar usuário. Por favor, tente novamente mais tarde.']);
}
?>