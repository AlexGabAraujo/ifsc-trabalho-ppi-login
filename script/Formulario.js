// script/Formulario.js
document.addEventListener("DOMContentLoaded", () => {
    const storageKey = "quiz_perguntas";

    // This 'perfil' variable needs to be dynamically set based on the user's session from PHP
    // For now, we'll assume it's fetched via an API call or rendered directly by PHP.
    // Example: fetch('../backend/get_user_info.php').then(res => res.json()).then(data => { const isAdmin = data.perfil === 'admin'; adjustInterface(isAdmin); });
    // For local testing without a full user info endpoint, you might hardcode for admin.
    let perfil = localStorage.getItem("perfil"); // Fallback for local testing, will be replaced by server-side logic
    // For production, the 'perfil' should come from the server session or a secure token.
    // E.g., a hidden input in HTML set by PHP: <input type="hidden" id="user-perfil" value="<?php echo $_SESSION['user_profile'] ?? 'comum'; ?>">
    const isAdmin = perfil === "admin"; // This must reflect the backend session's user profile

    const criaForms = document.getElementById("criaForms");
    const bodyForm = document.querySelector(".bodyForm");
    const addQuestionForm = document.getElementById("add-question-form");
    const questionFormSection = document.getElementById("question-form");
    const questionsListDiv = document.getElementById("questions-list");
    const adminControlsDiv = document.getElementById("admin-controls");
    const usernameSpan = document.getElementById('username'); // Assuming this exists in Formulario.html header

    let perguntas = [];
    let perguntasEmbaralhadas = [];
    let indiceAtual = 0;
    let pontuacao = 0;

    // Fetch user name from backend for header display
    fetch('../backend/get_user_info.php') // You would create a simple PHP file to return $_SESSION['user_name'] and $_SESSION['user_profile']
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (usernameSpan) {
                    usernameSpan.textContent = data.userName;
                }
                perfil = data.userProfile; // Update perfil based on backend
                adjustInterface(); // Adjust interface after knowing user's profile
            } else {
                if (usernameSpan) {
                    usernameSpan.textContent = 'Usuário'; // Default if not logged in or error
                }
                console.error("Failed to fetch user info:", data.message);
            }
        })
        .catch(error => {
            console.error("Error fetching user info:", error);
            if (usernameSpan) {
                usernameSpan.textContent = 'Usuário';
            }
        });

    // --- Backend Integration for Quiz Questions ---

    // Function to fetch questions from backend
    async function carregarPerguntas() {
        try {
            const response = await fetch("../backend/quiz_api.php");
            const data = await response.json();
            if (data.success) {
                perguntas = data.questions;
            } else {
                console.error("Erro ao carregar perguntas:", data.message);
                perguntas = []; // Fallback to empty if backend fails
            }
        } catch (error) {
            console.error("Erro de rede ao carregar perguntas:", error);
            perguntas = [];
        }
        reiniciarQuiz(); // Restart quiz with loaded questions
        if (isAdmin) {
            renderQuestionManagementList();
        }
    }

    // Function to save a new question to backend
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
                await carregarPerguntas(); // Reload questions from backend
                addQuestionForm.reset();
                questionFormSection.style.display = "none"; // Hide form after adding
            } else {
                alert("Erro ao adicionar pergunta: " + data.message);
            }
        } catch (error) {
            alert("Erro de rede ao adicionar pergunta.");
            console.error("Erro ao adicionar pergunta:", error);
        }
    }

    // Function to update an existing question in backend
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
                await carregarPerguntas(); // Reload questions from backend
            } else {
                alert("Erro ao editar pergunta: " + data.message);
            }
        } catch (error) {
            alert("Erro de rede ao editar pergunta.");
            console.error("Erro ao editar pergunta:", error);
        }
    }

    // Function to delete a question from backend
    async function excluirPerguntaDoBackend(id) {
        try {
            const response = await fetch("../backend/quiz_api.php", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: id }), // Send ID in body for DELETE
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                await carregarPerguntas(); // Reload questions from backend
            } else {
                alert("Erro ao excluir pergunta: " + data.message);
            }
        } catch (error) {
            alert("Erro de rede ao excluir pergunta.");
            console.error("Erro ao excluir pergunta:", error);
        }
    }

    // --- Quiz Logic (mostly unchanged, but data comes from backend now) ---

    function criarQuiz() {
        bodyForm.innerHTML = `
            <div id="quiz-container" style="width: 100%;">
                <div style="width: 100%; background-color: #ddd; border-radius: 10px; overflow: hidden; margin-bottom: 15px;">
                    <div id="progress-bar" style="width: 0%; height: 20px; background: linear-gradient(to right, rgb(206, 174, 228), rgb(86, 41, 116));transition: width 0.3s ease;"></div>
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
            </div>
        `;

        document.getElementById("btn-proximo").addEventListener("click", proximaPergunta);

        // Ensure admin buttons are added only if isAdmin is true
        if (isAdmin) {
            const adminButtonsDiv = document.createElement('div');
            adminButtonsDiv.style.marginTop = '20px';
            adminButtonsDiv.innerHTML = `
                <button id="btn-excluir" style="background:#d9534f;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;">Excluir pergunta atual</button>
                <button id="btn-editar" style="background:#f0ad4e;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Editar pergunta atual</button>
                <button id="btn-adicionar" style="background:#5cb85c;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;margin-left:5px;">Adicionar nova pergunta</button>
            `;
            document.getElementById("quiz-container").appendChild(adminButtonsDiv);

            document.getElementById("btn-excluir").addEventListener("click", excluirPerguntaAtual);
            document.getElementById("btn-editar").addEventListener("click", editarPerguntaAtual);
            document.getElementById("btn-adicionar").addEventListener("click", () => {
                questionFormSection.style.display = "block"; // Show the add question form
                addQuestionForm.reset();
            });

            // Admin question form submission
            if (addQuestionForm) {
                addQuestionForm.addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const questionText = document.getElementById("question-text").value.trim();
                    const option1 = document.getElementById("option1").value.trim();
                    const option2 = document.getElementById("option2").value.trim();
                    const option3 = document.getElementById("option3").value.trim();
                    const option4 = document.getElementById("option4").value.trim();
                    const correctAnswer = parseInt(document.getElementById("correct-answer").value) - 1; // 0-indexed

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

            // Admin question form cancel button
            const cancelFormBtn = document.getElementById("cancel-form");
            if (cancelFormBtn) {
                cancelFormBtn.addEventListener("click", () => {
                    questionFormSection.style.display = "none";
                    addQuestionForm.reset();
                });
            }
        }
        reiniciarQuiz();
    }

    function reiniciarQuiz() {
        if (perguntas.length === 0) {
            const quizContent = document.getElementById("quiz-content");
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
        // Update question count in score-display
        document.getElementById("total-questions").textContent = perguntasEmbaralhadas.length;
        document.getElementById("current-question").textContent = indiceAtual + 1;
    }

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
            const percentual = ((indiceAtual) / totalQuestions) * 100; // Corrected calculation
            progressBar.style.width = percentual + "%";
        }
    }

    function mostrarPergunta() {
        if (perguntasEmbaralhadas.length === 0) return;

        atualizarBarraProgresso();
        document.getElementById("current-question").textContent = indiceAtual + 1; // Update current question number

        const fadeContainer = document.getElementById("fade-container");
        fadeContainer.style.opacity = 0;

        setTimeout(() => {
            const perguntaAtual = perguntasEmbaralhadas[indiceAtual];
            const perguntaTexto = document.getElementById("question-text"); // Use original HTML element
            const optionsContainer = document.getElementById("options-container"); // Use original HTML element
            const nextBtn = document.getElementById("next-btn");
            const prevBtn = document.getElementById("prev-btn"); // Original HTML prev button
            const finishBtn = document.getElementById("finish-btn"); // Original HTML finish button

            if (perguntaTexto) perguntaTexto.textContent = perguntaAtual.texto;
            if (optionsContainer) optionsContainer.innerHTML = ""; // Clear existing options

            if (nextBtn) nextBtn.disabled = true;
            if (prevBtn) prevBtn.style.display = "none"; // Hide prev button initially
            if (finishBtn) finishBtn.style.display = "none"; // Hide finish button initially

            perguntaAtual.opcoes.forEach((opcao, idx) => {
                const label = document.createElement("label");
                label.classList.add("option");

                const radio = document.createElement("input");
                radio.type = "radio";
                radio.name = "answer";
                radio.value = idx;

                radio.addEventListener("change", () => {
                    if (nextBtn) nextBtn.disabled = false;
                    // Add/remove 'selected' class for styling
                    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                    label.classList.add('selected');
                });

                label.appendChild(radio);
                label.appendChild(document.createTextNode(opcao));
                if (optionsContainer) optionsContainer.appendChild(label);
            });

            // Control button visibility
            if (nextBtn) nextBtn.style.display = "inline-block";
            if (indiceAtual === perguntasEmbaralhadas.length - 1) {
                if (nextBtn) nextBtn.style.display = "none"; // Hide next button on last question
                if (finishBtn) finishBtn.style.display = "inline-block"; // Show finish button
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

        if (quizContent) quizContent.style.display = "none"; // Hide quiz questions

        if (finalResultDiv) {
            finalResultDiv.style.display = "block";
            finalResultDiv.innerHTML = `
                <div class="final-score">
                    <h2>Quiz Finalizado!</h2>
                    <p>Você acertou ${pontuacao} de ${perguntasEmbaralhadas.length} perguntas.</p>
                    <button class="btn btn-primary" onclick="reiniciarQuiz()">Reiniciar Quiz</button>
                    </div>
            `;
            // Save last quiz score to localStorage (for display in Config.html)
            const percentageScore = Math.round((pontuacao / perguntasEmbaralhadas.length) * 100);
            localStorage.setItem("lastQuizScore", percentageScore);

            // You might want to also send this score to the backend to save user's performance
            // fetch('../backend/save_quiz_score.php', { method: 'POST', body: JSON.stringify({ score: percentageScore }) });
        }
    }

    // --- Admin Functions ---

    function renderQuestionManagementList() {
        if (!questionsListDiv) return;
        questionsListDiv.innerHTML = '';
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
            if (novaOpcao === null) return; // User cancelled
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
    }

    // Initial load
    carregarPerguntas(); // This will load questions and then call reiniciarQuiz
    adjustInterface(); // Adjust interface based on initial isAdmin value (will be re-adjusted after user profile fetch)

    // Event listener for Prev and Next/Finish buttons (using their IDs from Formulario.html)
    const prevButton = document.getElementById("prev-btn");
    const nextButton = document.getElementById("next-btn");
    const finishButton = document.getElementById("finish-btn");

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            if (indiceAtual > 0) {
                indiceAtual--;
                mostrarPergunta();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", proximaPergunta);
    }

    if (finishButton) {
        finishButton.addEventListener("click", mostrarResultado);
    }
});