<?php
session_start();
header('Content-Type: application/json');
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$isAdmin = isset($_SESSION['user_profile']) && $_SESSION['user_profile'] === 'admin';

switch ($method) {
    case 'GET':
        // mandar as questoes
        try {
            $stmt = $pdo->query("SELECT id, texto, opcao1, opcao2, opcao3, opcao4, correta FROM questao");
            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // formatar as questoes para uma array
            foreach ($questions as &$q) {
                $q['opcoes'] = [$q['opcao1'], $q['opcao2'], $q['opcao3'], $q['opcao4']];
                unset($q['opcao1'], $q['opcao2'], $q['opcao3'], $q['opcao4']);
            }
            echo json_encode(['success' => true, 'questions' => $questions]);
        } catch (\PDOException $e) {
            error_log("Error fetching quiz questions: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Erro ao carregar perguntas do quiz.']);
        }
        break;

    case 'POST':
        // adicionar uma nova questao (apenas para os adms )
        if (!$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem adicionar perguntas.']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $texto = $data['texto'] ?? '';
        $opcoes = $data['opcoes'] ?? [];
        $correta = $data['correta'] ?? null;

        if (empty($texto) || count($opcoes) !== 4 || !isset($opcoes[0]) || !isset($opcoes[1]) || !isset($opcoes[2]) || !isset($opcoes[3]) || !is_numeric($correta) || $correta < 0 || $correta > 3) {
            echo json_encode(['success' => false, 'message' => 'Dados da pergunta inválidos.']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO questao (texto, opcao1, opcao2, opcao3, opcao4, correta) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$texto, $opcoes[0], $opcoes[1], $opcoes[2], $opcoes[3], $correta]);
            echo json_encode(['success' => true, 'message' => 'Pergunta adicionada com sucesso!']);
        } catch (\PDOException $e) {
            error_log("Error adding quiz question: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Erro ao adicionar pergunta.']);
        }
        break;

    case 'PUT':
        // atualizar uma questao (apenas para os adms)
        if (!$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem editar perguntas.']);
            exit();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;
        $texto = $data['texto'] ?? '';
        $opcoes = $data['opcoes'] ?? [];
        $correta = $data['correta'] ?? null;

        if (empty($id) || empty($texto) || count($opcoes) !== 4 || !isset($opcoes[0]) || !isset($opcoes[1]) || !isset($opcoes[2]) || !isset($opcoes[3]) || !is_numeric($correta) || $correta < 0 || $correta > 3) {
            echo json_encode(['success' => false, 'message' => 'Dados de atualização inválidos.']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("UPDATE questao SET texto = ?, opcao1 = ?, opcao2 = ?, opcao3 = ?, opcao4 = ?, correta = ? WHERE id = ?");
            $stmt->execute([$texto, $opcoes[0], $opcoes[1], $opcoes[2], $opcoes[3], $correta, $id]);
            echo json_encode(['success' => true, 'message' => 'Pergunta atualizada com sucesso!']);
        } catch (\PDOException $e) {
            error_log("Error updating quiz question: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Erro ao atualizar pergunta.']);
        }
        break;

    case 'DELETE':
        // deletar uma questao (apenas para os adms)
        if (!$isAdmin) {
            echo json_encode(['success' => false, 'message' => 'Acesso negado. Apenas administradores podem excluir perguntas.']);
            exit();
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? null;

        if (empty($id)) {
            echo json_encode(['success' => false, 'message' => 'ID da pergunta não fornecido.']);
            exit();
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM questao WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Pergunta excluída com sucesso!']);
        } catch (\PDOException $e) {
            error_log("Error deleting quiz question: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Erro ao excluir pergunta.']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
        break;
}
?>