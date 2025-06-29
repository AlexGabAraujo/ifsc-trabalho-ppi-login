document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "quiz_perguntas";

  // Perguntas padrão
  const perguntasPadrao = [
    {
      texto: "O que é a 'nuvem' (cloud computing)?",
      opcoes: ["Um computador físico dentro da empresa", "Um servidor local", "Armazenamento e processamento remoto via internet ", "Um tipo de vírus"],
      correta: 2
    },
    {
      texto: "Qual linguagem é usada para estilizar páginas web?",
      opcoes: ["Um tipo de cabo de rede", "Uma tecnologia de rede sem fio", "Um protocolo de segurança", "Um tipo de modem"],
      correta: 1
    },
    {
      texto: "Qual linguagem é usada para estilizar páginas web?",
      opcoes: ["HTML", "JavaScript", "CSS", "Python"],
      correta: 2
    },
    {
      texto: "Qual destas tecnologias é usada na automação de tarefas repetitivas com aprendizado contínuo?",
      opcoes: ["Blockchain", "Inteligência Artificial ", "Realidade Virtual", "Cloud Computing"],
      correta: 1
    },
    {
      texto: "O que significa a sigla 'IP' em redes?",
      opcoes: ["Internet Provider", "Internal Point", "Internet Path", "Internet Protocol"],
      correta: 3
    },
    {
      texto: "O que significa a sigla 'HTML'?",
      opcoes: ["HyperText Markup Language ", "HighText Machine Language", "HyperText Multiprotocol Language", "Home Tool Multi Language"],
      correta: 0
    },
    {
      texto: "Qual destes é um sistema operacional móvel?",
      opcoes: ["Windows", "Linux", "Android", "macOS"],
      correta: 2
    },
    {
      texto: "Qual destas é utilizada para armazenar dados temporários enquanto o computador está ligado?",
      opcoes: ["SSD", "HD", "ROM", "RAM"],
      correta: 3
    }
  ];
  const isAdmin = perfil === "admin";

  const criaForms = document.getElementById("criaForms");
  const bodyForm = document.querySelector(".bodyForm");

  let perguntas = [];  // será carregado do localStorage ou perguntasPadrao
  let perguntasEmbaralhadas = [];
  let indiceAtual = 0;
  let pontuacao = 0;

  // Função para salvar perguntas no localStorage (em JSON)
  function salvarPerguntas() {
    localStorage.setItem(storageKey, JSON.stringify(perguntas));
  }

  // Função para carregar perguntas do localStorage (se existir), senão usa padrão
  function carregarPerguntas() {
    const dados = localStorage.getItem(storageKey);
    if (dados) {
      try {
        perguntas = JSON.parse(dados);
      } catch {
        perguntas = [...perguntasPadrao];
      }
    } else {
      perguntas = [...perguntasPadrao];
    }
  }

  function criarQuiz() {
    bodyForm.innerHTML = `
      <div id="quiz-container" style="width: 100%;">
        <div style="width: 100%; background-color: #ddd; border-radius: 10px; overflow: hidden; margin-bottom: 15px;">
          <div id="progress-bar" style="width: 0%; height: 20px;  background: linear-gradient(to right, rgb(206, 174, 228), rgb(86, 41, 116));transition: width 0.3s ease;"></div>
        </div>
        <div id="fade-container" style=" transition: opacity 0.5s ease; opacity: 1;">
          <h3 id="pergunta-texto"></h3>
          <form id="quiz-form"></form>
          <button id="btn-proximo" disabled style="
            margin-top: 10px;
            padding: 8px 20px;
            border-radius: 8px;
            border: none;
            background: var(--cor1);
            color: white;
            font-weight: 600;
            cursor: pointer;
          ">Próxima</button>
          <div id="resultado" style="margin-top: 15px; font-weight: 700; color: var(--cor1);"></div>
        </div>
        ${isAdmin ? `
        <div style="margin-top:20px;">
          <button id="btn-excluir" style="background:#d9534f;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Excluir pergunta</button>
          <button id="btn-editar" style="background:#f0ad4e;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Editar pergunta</button>
          <button id="btn-adicionar" style="background:#5cb85c;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Adicionar pergunta</button>
        </div>` : ""}
      </div>
    `;

    document.getElementById("btn-proximo").addEventListener("click", proximaPergunta);
    if (isAdmin) {
      document.getElementById("btn-excluir").addEventListener("click", excluirPerguntaAtual);
      document.getElementById("btn-editar").addEventListener("click", editarPerguntaAtual);
      document.getElementById("btn-adicionar").addEventListener("click", adicionarPergunta);
    }

    reiniciarQuiz();
  }

  function reiniciarQuiz() {
    perguntasEmbaralhadas = embaralharArray([...perguntas]);
    indiceAtual = 0;
    pontuacao = 0;
    atualizarBarraProgresso();
    mostrarPergunta();
  }

  function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function atualizarBarraProgresso() {
    const progressBar = document.getElementById("progress-bar");
    const percentual = (indiceAtual / perguntasEmbaralhadas.length) * 100;
    progressBar.style.width = percentual + "%";
  }

  function mostrarPergunta() {
    atualizarBarraProgresso();

    const fadeContainer = document.getElementById("fade-container");
    fadeContainer.style.opacity = 0;

    setTimeout(() => {
      const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
      const perguntaTexto = document.getElementById("pergunta-texto");
      const quizForm = document.getElementById("quiz-form");
      const resultado = document.getElementById("resultado");
      const btnProximo = document.getElementById("btn-proximo");

      perguntaTexto.textContent = perguntaAtual.texto;
      quizForm.innerHTML = "";
      resultado.textContent = "";
      btnProximo.disabled = true;

      perguntaAtual.opcoes.forEach((opcao, idx) => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.marginBottom = "10px";
        label.style.cursor = "pointer";
        label.style.border = "1px solid #ccc";
        label.style.padding = "10px";
        label.style.borderRadius = "6px";
        label.style.width = "100%";
        label.style.textAlign = "left";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "opcao";
        radio.value = idx;
        radio.style.marginRight = "8px";

        radio.addEventListener("change", () => {
          btnProximo.disabled = false;
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(opcao));

        quizForm.appendChild(label);
      });

      fadeContainer.style.opacity = 1;
    }, 300);
  }

  function proximaPergunta() {
    const quizForm = document.getElementById("quiz-form");
    const selecionada = quizForm.querySelector("input[name='opcao']:checked");
    if (!selecionada) return;

    const valorSelecionado = parseInt(selecionada.value);
    if (valorSelecionado === perguntasEmbaralhadas[indiceAtual].correta) {
      pontuacao++;
    }

    indiceAtual++;
    if (indiceAtual < perguntasEmbaralhadas.length) {
      mostrarPergunta();
    } else {
      mostrarResultado();
    }
  }

  function mostrarResultado() {
    atualizarBarraProgresso();
    const perguntaTexto = document.getElementById("pergunta-texto");
    const quizForm = document.getElementById("quiz-form");
    const btnProximo = document.getElementById("btn-proximo");
    const resultado = document.getElementById("resultado");

    perguntaTexto.textContent = "Quiz finalizado!";
    quizForm.style.display = "none";
    btnProximo.style.display = "none";
    resultado.textContent = `Você acertou ${pontuacao} de ${perguntasEmbaralhadas.length} perguntas.`;
    localStorage.setItem("quiz_pontuacao", pontuacao);
  }

  function excluirPerguntaAtual() {
    const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
    if (confirm("Tem certeza que quer excluir esta pergunta?")) {
      const idxOriginal = perguntas.findIndex(p => p.texto === perguntaAtual.texto);
      if (idxOriginal > -1) {
        perguntas.splice(idxOriginal, 1);
        salvarPerguntas();  // salva no localStorage após exclusão
        reiniciarQuiz();
      }
    }
  }

  function editarPerguntaAtual() {
    const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
    const idxOriginal = perguntas.findIndex(p => p.texto === perguntaAtual.texto);
    if (idxOriginal === -1) return;

    const novoTexto = prompt("Novo texto da pergunta:", perguntaAtual.texto);
    if (!novoTexto) return;

    const novasOpcoes = [];
    for (let i = 0; i < 4; i++) {
      const novaOpcao = prompt(`Nova opção ${i + 1}:`, perguntaAtual.opcoes[i] || "");
      if (!novaOpcao) return; // cancelar se qualquer opção for vazia
      novasOpcoes.push(novaOpcao);
    }
    const novaCorreta = parseInt(prompt("Qual o número da alternativa correta? (1-4)", perguntaAtual.correta + 1)) - 1;
    if (novaCorreta < 0 || novaCorreta > 3 || isNaN(novaCorreta)) return;

    perguntas[idxOriginal].texto = novoTexto;
    perguntas[idxOriginal].opcoes = novasOpcoes;
    perguntas[idxOriginal].correta = novaCorreta;

    salvarPerguntas();  // salva no localStorage após edição
    reiniciarQuiz();
  }

  function adicionarPergunta() {
    const novoTexto = prompt("Digite o texto da nova pergunta:");
    if (!novoTexto) return;

    const novasOpcoes = [];
    for (let i = 0; i < 4; i++) {
      const opcao = prompt(`Digite a opção ${i + 1}:`);
      if (!opcao) return; // cancelar se qualquer opção for vazia
      novasOpcoes.push(opcao);
    }
    const novaCorreta = parseInt(prompt("Qual o número da alternativa correta? (1-4)")) - 1;
    if (novaCorreta < 0 || novaCorreta > 3 || isNaN(novaCorreta)) return;

    perguntas.push({
      texto: novoTexto,
      opcoes: novasOpcoes,
      correta: novaCorreta
    });

    salvarPerguntas();  // salva no localStorage após adicionar
    reiniciarQuiz();
  }

  function ajustarInterface() {
    if (!isAdmin) {
      criaForms.style.display = "none";
    } else {
      criaForms.style.display = "flex";
    }
  }

  ajustarInterface();
  carregarPerguntas(); // carrega as perguntas do localStorage ou padrão
  criarQuiz();
});
