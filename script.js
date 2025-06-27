$(document).ready(function() {
    let currentUser = null;
    let currentQuiz = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let quizScore = 0;

    // Inicialização
    checkSession();

    // Event Listeners
    $('#login-form').on('submit', handleLogin);
    $('#register-form').on('submit', handleRegister);
    $('#profile-form').on('submit', handleUpdateProfile);
    $('#add-question-form').on('submit', handleAddQuestion);
    $('#edit-question-form').on('submit', handleEditQuestion);

    // Navigation
    $('#show-register').on('click', function(e) {
        e.preventDefault();
        showSection('register-area');
    });

    $('#show-login').on('click', function(e) {
        e.preventDefault();
        showSection('login-area');
    });

    $('#logout-btn').on('click', handleLogout);
    $('#profile-btn').on('click', function() {
        loadProfile();
        showContent('profile-area');
    });

    $('#admin-btn').on('click', function() {
        loadQuestions();
        showContent('admin-area');
    });

    $('#start-quiz-btn').on('click', startQuiz);
    $('#next-question-btn').on('click', nextQuestion);
    $('#restart-quiz-btn').on('click', startQuiz);
    $('#back-dashboard-btn').on('click', function() {
        showContent('dashboard');
        loadDashboard();
    });

    $('#back-from-profile-btn').on('click', function() {
        showContent('dashboard');
    });

    $('#back-from-admin-btn').on('click', function() {
        showContent('dashboard');
    });

    $('#delete-account-btn').on('click', handleDeleteAccount);

    // Admin tabs
    $('.tab-btn').on('click', function() {
        const tab = $(this).data('tab');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').addClass('hidden');
        $('#' + tab).removeClass('hidden');
    });

    // Modal
    $('.close, .cancel-btn').on('click', function() {
        $('#edit-question-modal').addClass('hidden');
    });

    // Options selection
    $(document).on('click', '.option', function() {
        $('.option').removeClass('selected');
        $(this).addClass('selected');
        $('#next-question-btn').prop('disabled', false);
    });

    // Functions
    function checkSession() {
        $.ajax({
            url: 'php/check_session.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && response.user) {
                    currentUser = response.user;
                    showMainArea();
                    loadDashboard();
                } else {
                    showSection('login-area');
                }
            },
            error: function() {
                showSection('login-area');
            }
        });
    }

    function handleLogin(e) {
        e.preventDefault();
        const formData = {
            email: $('#email').val(),
            password: $('#password').val()
        };

        $.ajax({
            url: 'php/login.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    currentUser = response.user;
                    showMessage('Login realizado com sucesso!', 'success');
                    showMainArea();
                    loadDashboard();
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('Erro ao fazer login. Tente novamente.', 'error');
            }
        });
    }

    function handleRegister(e) {
        e.preventDefault();
        
        const password = $('#reg-password').val();
        const confirmPassword = $('#reg-confirm-password').val();
        
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.', 'error');
            return;
        }

        const formData = {
            name: $('#reg-name').val(),
            email: $('#reg-email').val(),
            password: password
        };

        $.ajax({
            url: 'php/register.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage('Cadastro realizado com sucesso! Faça login.', 'success');
                    showSection('login-area');
                    $('#register-form')[0].reset();
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('Erro ao cadastrar. Tente novamente.', 'error');
            }
        });
    }

    function handleLogout() {
        $.ajax({
            url: 'php/logout.php',
            method: 'POST',
            success: function() {
                currentUser = null;
                showMessage('Logout realizado com sucesso!', 'success');
                showSection('login-area');
                $('#login-form')[0].reset();
            }
        });
    }

    function loadProfile() {
        $('#profile-name').val(currentUser.name);
        $('#profile-email').val(currentUser.email);
        $('#new-password').val('');
    }

    function handleUpdateProfile(e) {
        e.preventDefault();
        
        const formData = {
            name: $('#profile-name').val(),
            email: $('#profile-email').val(),
            new_password: $('#new-password').val()
        };

        $.ajax({
            url: 'php/update_profile.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    currentUser.name = formData.name;
                    currentUser.email = formData.email;
                    updateUserDisplay();
                    showMessage('Perfil atualizado com sucesso!', 'success');
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('Erro ao atualizar perfil.', 'error');
            }
        });
    }

    function handleDeleteAccount() {
        if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
            $.ajax({
                url: 'php/delete_account.php',
                method: 'POST',
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        showMessage('Conta excluída com sucesso.', 'success');
                        currentUser = null;
                        showSection('login-area');
                    } else {
                        showMessage(response.message, 'error');
                    }
                },
                error: function() {
                    showMessage('Erro ao excluir conta.', 'error');
                }
            });
        }
    }

    function loadDashboard() {
        $.ajax({
            url: 'php/get_dashboard_data.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#score-display').text(response.score + '%');
                    $('#total-questions').text(response.total_questions);
                    $('#user-score').text('Pontuação: ' + response.score + '%');
                }
            }
        });
    }

    function startQuiz() {
        $.ajax({
            url: 'php/get_quiz_questions.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && response.questions.length > 0) {
                    currentQuiz = response.questions;
                    currentQuestionIndex = 0;
                    userAnswers = [];
                    quizScore = 0;
                    showContent('quiz-area');
                    displayQuestion();
                } else {
                    showMessage('Não há perguntas disponíveis no momento.', 'error');
                }
            },
            error: function() {
                showMessage('Erro ao carregar quiz.', 'error');
            }
        });
    }

    function displayQuestion() {
        const question = currentQuiz[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
        
        $('#question-counter').text(`Pergunta ${currentQuestionIndex + 1} de ${currentQuiz.length}`);
        $('#progress-fill').css('width', progress + '%');
        $('#question-text').text(question.question);
        
        const optionsHtml = `
            <div class="option" data-option="1">${question.option1}</div>
            <div class="option" data-option="2">${question.option2}</div>
            <div class="option" data-option="3">${question.option3}</div>
            <div class="option" data-option="4">${question.option4}</div>
        `;
        
        $('#options-container').html(optionsHtml);
        $('#next-question-btn').prop('disabled', true);
    }

    function nextQuestion() {
        const selectedOption = $('.option.selected').data('option');
        const question = currentQuiz[currentQuestionIndex];
        
        userAnswers.push({
            question_id: question.id,
            selected_option: selectedOption,
            correct_option: question.correct_option
        });
        
        if (selectedOption == question.correct_option) {
            quizScore++;
        }
        
        currentQuestionIndex++;
        
        if (currentQuestionIndex < currentQuiz.length) {
            displayQuestion();
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        const finalScore = Math.round((quizScore / currentQuiz.length) * 100);
        
        // Salvar resultado
        $.ajax({
            url: 'php/save_quiz_result.php',
            method: 'POST',
            data: {
                score: finalScore,
                answers: JSON.stringify(userAnswers)
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    currentUser.score = finalScore;
                    updateUserDisplay();
                }
            }
        });
        
        // Mostrar resultado
        $('#final-score').text(finalScore + '%');
        $('#correct-answers').text(quizScore);
        $('#total-answered').text(currentQuiz.length);
        showContent('result-area');
    }

    function handleAddQuestion(e) {
        e.preventDefault();
        
        const formData = {
            question: $('#question-text-input').val(),
            option1: $('#option1').val(),
            option2: $('#option2').val(),
            option3: $('#option3').val(),
            option4: $('#option4').val(),
            correct_option: $('#correct-option').val()
        };

        $.ajax({
            url: 'php/add_question.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage('Pergunta adicionada com sucesso!', 'success');
                    $('#add-question-form')[0].reset();
                    loadQuestions();
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('Erro ao adicionar pergunta.', 'error');
            }
        });
    }

    function loadQuestions() {
        $.ajax({
            url: 'php/get_questions.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    displayQuestionsList(response.questions);
                }
            }
        });
    }

    function displayQuestionsList(questions) {
        let html = '';
        
        questions.forEach(function(question) {
            html += `
                <div class="question-item">
                    <h4>${question.question}</h4>
                    <div class="options">
                        <div class="option-text ${question.correct_option == 1 ? 'correct' : ''}">1. ${question.option1}</div>
                        <div class="option-text ${question.correct_option == 2 ? 'correct' : ''}">2. ${question.option2}</div>
                        <div class="option-text ${question.correct_option == 3 ? 'correct' : ''}">3. ${question.option3}</div>
                        <div class="option-text ${question.correct_option == 4 ? 'correct' : ''}">4. ${question.option4}</div>
                    </div>
                    <div class="question-actions">
                        <button onclick="editQuestion(${question.id})">Editar</button>
                        <button onclick="deleteQuestion(${question.id})" class="danger-btn">Excluir</button>
                    </div>
                </div>
            `;
        });
        
        $('#questions-list').html(html);
    }

    // Global functions for question management
    window.editQuestion = function(id) {
        $.ajax({
            url: 'php/get_question.php',
            method: 'GET',
            data: { id: id },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    const question = response.question;
                    $('#edit-question-id').val(question.id);
                    $('#edit-question-text').val(question.question);
                    $('#edit-option1').val(question.option1);
                    $('#edit-option2').val(question.option2);
                    $('#edit-option3').val(question.option3);
                    $('#edit-option4').val(question.option4);
                    $('#edit-correct-option').val(question.correct_option);
                    $('#edit-question-modal').removeClass('hidden');
                }
            }
        });
    };

    window.deleteQuestion = function(id) {
        if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
            $.ajax({
                url: 'php/delete_question.php',
                method: 'POST',
                data: { id: id },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        showMessage('Pergunta excluída com sucesso!', 'success');
                        loadQuestions();
                    } else {
                        showMessage(response.message, 'error');
                    }
                },
                error: function() {
                    showMessage('Erro ao excluir pergunta.', 'error');
                }
            });
        }
    };

    function handleEditQuestion(e) {
        e.preventDefault();
        
        const formData = {
            id: $('#edit-question-id').val(),
            question: $('#edit-question-text').val(),
            option1: $('#edit-option1').val(),
            option2: $('#edit-option2').val(),
            option3: $('#edit-option3').val(),
            option4: $('#edit-option4').val(),
            correct_option: $('#edit-correct-option').val()
        };

        $.ajax({
            url: 'php/update_question.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showMessage('Pergunta atualizada com sucesso!', 'success');
                    $('#edit-question-modal').addClass('hidden');
                    loadQuestions();
                } else {
                    showMessage(response.message, 'error');
                }
            },
            error: function() {
                showMessage('Erro ao atualizar pergunta.', 'error');
            }
        });
    }

    // Utility functions
    function showSection(sectionId) {
        $('.section').addClass('hidden');
        $('#' + sectionId).removeClass('hidden');
    }

    function showContent(contentId) {
        $('.content-area').addClass('hidden');
        $('#' + contentId).removeClass('hidden');
    }

    function showMainArea() {
        showSection('main-area');
        updateUserDisplay();
        showContent('dashboard');
    }

    function updateUserDisplay() {
        $('#user-name').text(currentUser.name);
        $('#user-score').text('Pontuação: ' + (currentUser.score || 0) + '%');
        
        if (currentUser.is_admin == 1) {
            $('#admin-btn').removeClass('hidden');
        } else {
            $('#admin-btn').addClass('hidden');
        }
    }

    function showMessage(message, type) {
        const messageHtml = `<div class="message ${type}">${message}</div>`;
        $('#message-area').append(messageHtml);
        
        setTimeout(function() {
            $('#message-area .message').first().fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    }
});