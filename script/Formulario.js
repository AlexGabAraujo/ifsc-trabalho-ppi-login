document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "quiz_perguntas";
  let perfil = localStorage.getItem("perfil");
  let isAdmin = perfil === "admin";

  const criaForms = document.getElementById("criaForms");
  const bodyForm = document.querySelector(".bodyForm");
  const addQuestionForm = document.getElementById("add-question-form");
  const questionFormSection = document.getElementById("question-form");
  const questionsListDiv = document.getElementById("questions-list");
  const adminControlsDiv = document.getElementById("admin-controls");
  const usernameSpan = document.getElementById('username');

  let perguntas = [];
  let perguntasEmbaralhadas = [];
  let indiceAtual = 0;
  let pontuacao = 0;

  fetch('../backend/get_user_info.php')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (usernameSpan) {
          usernameSpan.textContent = data.userName;
        }
        perfil = data.userProfile;
        isAdmin = perfil === "admin";
        adjustInterface();
        carregarPerguntas();
      } else {
        if (usernameSpan) {
          usernameSpan.textContent = 'Usuário';
        }
        console.error("Failed to fetch user info:", data.message);
        carregarPerguntas();
      }
    })
    .catch(error => {
      console.error("Error fetching user info:", error);
      if (usernameSpan) {
        usernameSpan.textContent = 'Usuário';
      }
      carregarPerguntas();
    });

  async function carregarPerguntas() {
    try {
      const response = await fetch("../backend/quiz_api.php");
      const data = await response.json();
      if (data.success) {
        perguntas = data.questions;
      } else {
        console.error("Erro ao carregar perguntas:", data.message);
        perguntas = [];
      }
    } catch (error) {
      console.error("Erro de rede ao carregar perguntas:", error);
      perguntas = [];
    }
    window.reiniciarQuiz();
    if (isAdmin) {
      renderQuestionManagementList();
    }
    addQuizButtonListeners();
  }

  async function salvarNovaPergunta(novaPergunta) {
    try {
      const response = await fetch("../backend/quiz_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaPergunta),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        await carregarPerguntas();
        addQuestionForm.reset();
        questionFormSection.style.display = "none";
      } else {
        alert("Erro ao adicionar pergunta: " + data.message);
      }
    } catch (error) {
      alert("Erro de rede ao adicionar pergunta.");
      console.error("Erro ao adicionar pergunta:", error);
    }
  }

  async function atualizarPerguntaNoBackend(perguntaAtualizada) {
    try {
      const response = await fetch("../backend/quiz_api.php", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perguntaAtualizada),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        await carregarPerguntas();
      } else {
        alert("Erro ao editar pergunta: " + data.message);
      }
    } catch (error) {
      alert("Erro de rede ao editar pergunta.");
      console.error("Erro ao editar pergunta:", error);
    }
  }

  async function excluirPerguntaDoBackend(id) {
    try {
      const response = await fetch("../backend/quiz_api.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        await carregarPerguntas();
      } else {
        alert("Erro ao excluir pergunta: " + data.message);
      }
    } catch (error) {
      alert("Erro de rede ao excluir pergunta.");
      console.error("Erro ao excluir pergunta:", error);
    }
  }

  function criarQuiz() {
    bodyForm.innerHTML = `
            <div class="progress-bar">
                <div id="progress-fill" class="progress-fill" style="width: 12.5%"></div>
            </div>
            
            <div class="score-display">
                Pergunta <span id="current-question">1</span> de <span id="total-questions">8</span>
            </div>
            
            <div id="quiz-content">
                <h2 id="question-text" class="question-text">O que é a 'nuvem' (cloud computing)?</h2>
                
                <div id="options-container" class="options-container">
                    </div>
                
                <div class="quiz-controls">
                    <button id="prev-btn" class="btn" style="display: none;">Anterior</button>
                    <button id="next-btn" class="btn btn-primary" disabled>Próxima</button>
                    <button id="finish-btn" class="btn btn-primary" style="display: none;">Finalizar Quiz</button>
                </div>
            </div>
            
            <div id="final-result" style="display: none;"></div>
        `;

    if (isAdmin) {
      const adminButtonsDiv = document.createElement('div');
      adminButtonsDiv.style.marginTop = '20px';
      adminButtonsDiv.innerHTML = `
                <button id="btn-excluir" style="background:#d9534f;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Excluir pergunta atual</button>
                <button id="btn-editar" style="background:#f0ad4e;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Editar pergunta atual</button>
                <button id="btn-adicionar" style="background:#5cb85c;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Adicionar nova pergunta</button>
            `;
      const quizContainerInsideBodyForm = bodyForm.querySelector('#quiz-content');
      if (quizContainerInsideBodyForm) {
        quizContainerInsideBodyForm.parentNode.insertBefore(adminButtonsDiv, quizContainerInsideBodyForm.nextSibling);
      }


      document.getElementById("btn-excluir").addEventListener("click", excluirPerguntaAtual);
      document.getElementById("btn-editar").addEventListener("click", editarPerguntaAtual);
      document.getElementById("btn-adicionar").addEventListener("click", () => {
        questionFormSection.style.display = "block";
        addQuestionForm.reset();
      });

      if (addQuestionForm) {
        addQuestionForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const questionText = document.getElementById("new-question-input").value.trim();
          const option1 = document.getElementById("option1").value.trim();
          const option2 = document.getElementById("option2").value.trim();
          const option3 = document.getElementById("option3").value.trim();
          const option4 = document.getElementById("option4").value.trim();
          const correctAnswer = parseInt(document.getElementById("correct-answer").value) - 1;

          if (!questionText || !option1 || !option2 || !option3 || !option4 || isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
            alert("Por favor, preencha todos os campos da pergunta e selecione a resposta correta.");
            return;
          }

          const novaPergunta = {
            texto: questionText,
            opcoes: [option1, option2, option3, option4],
            correta: correctAnswer,
          };
          await salvarNovaPergunta(novaPergunta);
        });
      }

      const cancelFormBtn = document.getElementById("cancel-form");
      if (cancelFormBtn) {
        cancelFormBtn.addEventListener("click", () => {
          questionFormSection.style.display = "none";
          addQuestionForm.reset();
        });
      }
    }
    const addButton = document.getElementById("add");
    if (addButton) {
      addButton.addEventListener("click", () => {
        if (questionFormSection) {
          questionFormSection.style.display = "block";
          if (addQuestionForm) {
            addQuestionForm.reset();
          }
        }
      });
    }
  }

  window.reiniciarQuiz = function () {
    const finalResultDiv = document.getElementById("final-result");
    const quizContent = document.getElementById("quiz-content");

    if (finalResultDiv) finalResultDiv.style.display = "none";
    if (quizContent) quizContent.style.display = "block";

    if (perguntas.length === 0) {
      if (quizContent) {
        quizContent.innerHTML = "<p>Nenhuma pergunta disponível. Por favor, adicione perguntas se você for um administrador.</p>";
      }
      document.getElementById("progress-fill").style.width = "0%";
      document.getElementById("current-question").textContent = "0";
      document.getElementById("total-questions").textContent = "0";
      return;
    }
    perguntasEmbaralhadas = embaralharArray([...perguntas]);
    indiceAtual = 0;
    pontuacao = 0;
    atualizarBarraProgresso();
    mostrarPergunta();
    document.getElementById("total-questions").textContent = perguntasEmbaralhadas.length;
    document.getElementById("current-question").textContent = indiceAtual + 1;
  };

  function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function atualizarBarraProgresso() {
    const progressBar = document.getElementById("progress-fill");
    const totalQuestions = perguntasEmbaralhadas.length;
    if (totalQuestions === 0) {
      progressBar.style.width = "0%";
    } else {
      const percentual = ((indiceAtual) / totalQuestions) * 100;
      progressBar.style.width = percentual + "%";
    }
  }

  function mostrarPergunta() {
    if (perguntasEmbaralhadas.length === 0) return;

    atualizarBarraProgresso();
    document.getElementById("current-question").textContent = indiceAtual + 1;

    const fadeContainer = document.getElementById("quiz-content");
    fadeContainer.style.opacity = 0;

    setTimeout(() => {
      const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
      const perguntaTexto = document.getElementById("question-text");
      const optionsContainer = document.getElementById("options-container");
      const nextBtn = document.getElementById("next-btn");
      const prevBtn = document.getElementById("prev-btn");
      const finishBtn = document.getElementById("finish-btn");


      if (perguntaTexto) perguntaTexto.textContent = perguntaAtual.texto;
      if (optionsContainer) optionsContainer.innerHTML = "";

      if (nextBtn) nextBtn.disabled = true;
      if (prevBtn) prevBtn.style.display = "none";
      if (finishBtn) finishBtn.style.display = "none";

      perguntaAtual.opcoes.forEach((opcao, idx) => {
        const label = document.createElement("label");
        label.classList.add("option");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "answer";
        radio.value = idx;

        radio.addEventListener("change", () => {
          if (nextBtn) nextBtn.disabled = false;
          document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
          label.classList.add('selected');
        });

        label.appendChild(radio);
        label.appendChild(document.createTextNode(opcao));
        if (optionsContainer) optionsContainer.appendChild(label);
      });

      if (nextBtn) nextBtn.style.display = "inline-block";
      if (indiceAtual === perguntasEmbaralhadas.length - 1) {
        if (nextBtn) nextBtn.style.display = "none";
        if (finishBtn) finishBtn.style.display = "inline-block";
      } else {
        if (nextBtn) nextBtn.textContent = "Próxima";
      }
      if (indiceAtual > 0) {
        if (prevBtn) prevBtn.style.display = "inline-block";
      } else {
        if (prevBtn) prevBtn.style.display = "none";
      }

      fadeContainer.style.opacity = 1;
    }, 300);
  }

  function proximaPergunta() {
    const selectedOption = document.querySelector("input[name='answer']:checked");
    if (!selectedOption) return;

    const valorSelecionado = parseInt(selectedOption.value);
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
    const quizContent = document.getElementById("quiz-content");
    const finalResultDiv = document.getElementById("final-result");

    if (quizContent) quizContent.style.display = "none";

    if (finalResultDiv) {
      const percentageScore = Math.round((pontuacao / perguntasEmbaralhadas.length) * 100);
      localStorage.setItem("lastQuizScore", percentageScore);

      fetch('../backend/UpdateQuizScore.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: percentageScore })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Pontuação salva no banco de dados:', data.message);
          } else {
            console.error('Erro ao salvar pontuação no banco de dados:', data.message);
          }
        })
        .catch(error => {
          console.error('Erro de rede ao salvar pontuação:', error);
        });

      finalResultDiv.style.display = "block";
      finalResultDiv.innerHTML = `
                <div class="final-score">
                    <h2>Quiz Finalizado!</h2>
                    <p>Você acertou ${pontuacao} de ${perguntasEmbaralhadas.length} perguntas.</p>
                    <button class="btn btn-primary" onclick="reiniciarQuiz()">Reiniciar Quiz</button>
                    </div>
            `;
    }
  }

  function renderQuestionManagementList() {
    if (!questionsListDiv) return;
    questionsListDiv.innerHTML = '';
    if (perguntas.length === 0) {
      questionsListDiv.innerHTML = '<p>Nenhuma pergunta cadastrada.</p>';
      return;
    }
    perguntas.forEach(q => {
      const questionItem = document.createElement('div');
      questionItem.classList.add('question-item');
      questionItem.innerHTML = `
                <span>${q.texto}</span>
                <div>
                    <button class="edit-question" data-id="${q.id}">Editar</button>
                    <button class="delete-question" data-id="${q.id}">Excluir</button>
                </div>
            `;
      questionsListDiv.appendChild(questionItem);
    });

    document.querySelectorAll('.edit-question').forEach(button => {
      button.addEventListener('click', (e) => {
        const questionId = parseInt(e.target.dataset.id);
        const questionToEdit = perguntas.find(q => q.id === questionId);
        if (questionToEdit) {
          editarPergunta(questionToEdit);
        }
      });
    });

    document.querySelectorAll('.delete-question').forEach(button => {
      button.addEventListener('click', (e) => {
        const questionId = parseInt(e.target.dataset.id);
        if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
          excluirPerguntaDoBackend(questionId);
        }
      });
    });
  }

  async function excluirPerguntaAtual() {
    if (perguntasEmbaralhadas.length === 0) {
      alert("Não há perguntas para excluir.");
      return;
    }
    const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
    if (confirm("Tem certeza que quer excluir esta pergunta?")) {
      await excluirPerguntaDoBackend(perguntaAtual.id);
    }
  }

  async function editarPerguntaAtual() {
    if (perguntasEmbaralhadas.length === 0) {
      alert("Não há perguntas para editar.");
      return;
    }
    const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
    editarPergunta(perguntaAtual);
  }

  function editarPergunta(perguntaParaEditar) {
    const novoTexto = prompt("Novo texto da pergunta:", perguntaParaEditar.texto);
    if (!novoTexto) return;

    const novasOpcoes = [];
    for (let i = 0; i < 4; i++) {
      const novaOpcao = prompt(`Nova opção ${i + 1}:`, perguntaParaEditar.opcoes[i] || "");
      if (novaOpcao === null) return;
      novasOpcoes.push(novaOpcao);
    }
    const novaCorretaInput = prompt("Qual o número da alternativa correta? (1-4)", perguntaParaEditar.correta + 1);
    const novaCorreta = parseInt(novaCorretaInput) - 1;
    if (isNaN(novaCorreta) || novaCorreta < 0 || novaCorreta > 3) {
      alert("Resposta correta inválida.");
      return;
    }

    const perguntaAtualizada = {
      id: perguntaParaEditar.id,
      texto: novoTexto,
      opcoes: novasOpcoes,
      correta: novaCorreta
    };
    atualizarPerguntaNoBackend(perguntaAtualizada);
  }

  function adjustInterface() {
    if (adminControlsDiv) {
      adminControlsDiv.style.display = isAdmin ? "block" : "none";
    }
    if (isAdmin) {
      criarQuiz();
    }
  }

  carregarPerguntas();

  function addQuizButtonListeners() {
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    const finishButton = document.getElementById("finish-btn");

    const handlePrevClick = () => {
      if (indiceAtual > 0) {
        indiceAtual--;
        mostrarPergunta();
      }
    };

    if (prevButton) {
      prevButton.removeEventListener("click", handlePrevClick);
      prevButton.addEventListener("click", handlePrevClick);
    }

    if (nextButton) {
      nextButton.removeEventListener("click", proximaPergunta);
      nextButton.addEventListener("click", proximaPergunta);
    }

    if (finishButton) {
      finishButton.removeEventListener("click", mostrarResultado);
      finishButton.addEventListener("click", mostrarResultado);
    }
  }
});