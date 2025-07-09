CREATE DATABASE IF NOT EXISTS formulario_ppi;

USE formulario_ppi;

CREATE TABLE IF NOT EXISTS usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('comum', 'admin') DEFAULT 'comum'
);

CREATE TABLE IF NOT EXISTS `questao` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT NOT NULL,
    opcao1 VARCHAR(255) NOT NULL,
    opcao2 VARCHAR(255) NOT NULL,
    opcao3 VARCHAR(255) NOT NULL,
    opcao4 VARCHAR(255) NOT NULL,
    correta INT NOT NULL
);

ALTER TABLE usuario
ADD COLUMN last_quiz_score INT DEFAULT 0;

INSERT INTO questao (texto, opcao1, opcao2, opcao3, opcao4, correta) VALUES
('O que é a \'nuvem\' (cloud computing)?', 'Um computador físico dentro da empresa', 'Um servidor local', 'Armazenamento e processamento remoto via internet', 'Um tipo de vírus', 2),
('Qual linguagem é usada para estilizar páginas web?', 'Um tipo de cabo de rede', 'Uma tecnologia de rede sem fio', 'Um protocolo de segurança', 'Um tipo de modem', 1),
('Qual linguagem é usada para estilizar páginas web?', 'HTML', 'JavaScript', 'CSS', 'Python', 2),
('Qual destas tecnologias é usada na automação de tarefas repetitivas com aprendizado contínuo?', 'Blockchain', 'Inteligência Artificial', 'Realidade Virtual', 'Cloud Computing', 1),
('O que significa a sigla \'IP\' em redes?', 'Internet Provider', 'Internal Point', 'Internet Path', 'Internet Protocol', 3),
('O que significa a sigla \'HTML\'?', 'HyperText Markup Language', 'HighText Machine Language', 'HyperText Multiprotocol Language', 'Home Tool Multi Language', 0),
('Qual destes é um sistema operacional móvel?', 'Windows', 'Linux', 'Android', 'macOS', 2),
('Qual destas é utilizada para armazenar dados temporários enquanto o computador está ligado?', 'SSD', 'HD', 'ROM', 'RAM', 3);