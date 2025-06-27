<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Email e senha são obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, password, is_admin, score FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['is_admin'] = $user['is_admin'];
        
        unset($user['password']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso',
            'user' => $user
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Email ou senha incorretos']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($name) || empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'A senha deve ter pelo menos 6 caracteres']);
    exit;
}

try {
    // Verificar se o email já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Este email já está cadastrado']);
        exit;
    }
    
    // Criar novo usuário
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$name, $email, $hashedPassword]);
    
    echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, is_admin, score FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
        } else {
            session_destroy();
            echo json_encode(['success' => false, 'message' => 'Sessão inválida']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Não logado']);
}
?>

<?php
require_once 'config.php';

session_destroy();
echo json_encode(['success' => true, 'message' => 'Logout realizado com sucesso']);
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

try {
    // Buscar dados do usuário
    $stmt = $pdo->prepare("SELECT score FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Contar total de perguntas
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM questions");
    $stmt->execute();
    $totalQuestions = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'score' => $user['score'] ?? 0,
        'total_questions' => $totalQuestions
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM questions ORDER BY RAND() LIMIT 10");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'questions' => $questions
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$score = intval($_POST['score'] ?? 0);
$answers = $_POST['answers'] ?? '';

try {
    $pdo->beginTransaction();
    
    // Atualizar pontuação do usuário
    $stmt = $pdo->prepare("UPDATE users SET score = ? WHERE id = ?");
    $stmt->execute([$score, $_SESSION['user_id']]);
    
    // Salvar resultado do quiz
    $answersArray = json_decode($answers, true);
    $totalQuestions = count($answersArray);
    
    $stmt = $pdo->prepare("INSERT INTO quiz_results (user_id, score, total_questions, answers) VALUES (?, ?, ?, ?)");
    $stmt->execute([$_SESSION['user_id'], $score, $totalQuestions, $answers]);
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Resultado salvo com sucesso']);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$newPassword = $_POST['new_password'] ?? '';

if (empty($name) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Nome e email são obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

try {
    // Verificar se o email já existe para outro usuário
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $_SESSION['user_id']]);
    
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Este email já está sendo usado por outro usuário']);
        exit;
    }
    
    // Atualizar dados
    if (!empty($newPassword)) {
        if (strlen($newPassword) < 6) {
            echo json_encode(['success' => false, 'message' => 'A nova senha deve ter pelo menos 6 caracteres']);
            exit;
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?");
        $stmt->execute([$name, $email, $hashedPassword, $_SESSION['user_id']]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $stmt->execute([$name, $email, $_SESSION['user_id']]);
    }
    
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;
    
    echo json_encode(['success' => true, 'message' => 'Perfil atualizado com sucesso']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    
    session_destroy();
    
    echo json_encode(['success' => true, 'message' => 'Conta excluída com sucesso']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$question = trim($_POST['question'] ?? '');
$option1 = trim($_POST['option1'] ?? '');
$option2 = trim($_POST['option2'] ?? '');
$option3 = trim($_POST['option3'] ?? '');
$option4 = trim($_POST['option4'] ?? '');
$correctOption = intval($_POST['correct_option'] ?? 0);

if (empty($question) || empty($option1) || empty($option2) || empty($option3) || empty($option4)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    exit;
}

if ($correctOption < 1 || $correctOption > 4) {
    echo json_encode(['success' => false, 'message' => 'Opção correta inválida']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO questions (question, option1, option2, option3, option4, correct_option) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$question, $option1, $option2, $option3, $option4, $correctOption]);
    
    echo json_encode(['success' => true, 'message' => 'Pergunta adicionada com sucesso']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM questions ORDER BY created_at DESC");
    $stmt->execute();
    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'questions' => $questions
    ]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM questions WHERE id = ?");
    $stmt->execute([$id]);
    $question = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($question) {
        echo json_encode([
            'success' => true,
            'question' => $question
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Pergunta não encontrada']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$question = trim($_POST['question'] ?? '');
$option1 = trim($_POST['option1'] ?? '');
$option2 = trim($_POST['option2'] ?? '');
$option3 = trim($_POST['option3'] ?? '');
$option4 = trim($_POST['option4'] ?? '');
$correctOption = intval($_POST['correct_option'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

if (empty($question) || empty($option1) || empty($option2) || empty($option3) || empty($option4)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    exit;
}

if ($correctOption < 1 || $correctOption > 4) {
    echo json_encode(['success' => false, 'message' => 'Opção correta inválida']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE questions SET question = ?, option1 = ?, option2 = ?, option3 = ?, option4 = ?, correct_option = ? WHERE id = ?");
    $stmt->execute([$question, $option1, $option2, $option3, $option4, $correctOption, $id]);
    
    echo json_encode(['success' => true, 'message' => 'Pergunta atualizada com sucesso']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>

<?php
require_once 'config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID inválido']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM questions WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Pergunta excluída com sucesso']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Pergunta não encontrada']);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Erro interno do servidor']);
}
?>