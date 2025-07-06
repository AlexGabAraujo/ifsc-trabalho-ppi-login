document.addEventListener('DOMContentLoaded', function () {
    // Remove as chamadas iniciais que dependem apenas do localStorage
    // loadUserData();
    // loadLastQuizScore();

    // Adiciona uma função para buscar todos os dados do usuário do backend
    fetchAndDisplayUserData();
    setupEventListeners(); // Mantém os listeners para salvar perfil
});

async function fetchAndDisplayUserData() {
    try {
        const response = await fetch('../backend/get_user_info.php');
        const data = await response.json();

        if (data.success) {
            // Atualiza o nome de usuário no cabeçalho
            const usernameSpan = document.getElementById('username');
            if (usernameSpan) {
                usernameSpan.textContent = data.userName || 'Usuário';
            }

            // Atualiza os campos do formulário de perfil
            document.getElementById('nome').value = data.userName || '';
            document.getElementById('email').value = data.userEmail || '';
            document.getElementById('telefone').value = data.userPhone || '';
            document.getElementById('data-nasc').value = data.userBirthDate || '';

            // Atualiza o display name e avatar
            updateAvatar(data.userName || '');
            updateUserInfo(data.userBirthDate); // Passa a data de nascimento para a função

            // Atualiza a pontuação do quiz
            const lastQuizScoreEl = document.getElementById('last-quiz-score');
            if (lastQuizScoreEl) {
                lastQuizScoreEl.textContent = (data.lastQuizScore !== undefined ? data.lastQuizScore : 0) + '%';
                // Opcional: Salvar no localStorage também para consistência, mas o backend é a fonte primária
                localStorage.setItem('lastQuizScore', data.lastQuizScore !== undefined ? data.lastQuizScore : 0);
            }

            // Opcional: Atualizar localStorage 'userData' com os dados do backend
            localStorage.setItem('userData', JSON.stringify({
                nome: data.userName,
                email: data.userEmail,
                telefone: data.userPhone,
                dataNasc: data.userBirthDate
            }));

        } else {
            console.error("Erro ao buscar informações do usuário:", data.message);
            // Fallback para localStorage se o backend falhar
            loadUserDataFromLocalStorage();
            loadLastQuizScoreFromLocalStorage();
        }
    } catch (error) {
        console.error("Erro de rede ao buscar informações do usuário:", error);
        // Fallback para localStorage em caso de erro de rede
        loadUserDataFromLocalStorage();
        loadLastQuizScoreFromLocalStorage();
    }
}

// Função de fallback para carregar do localStorage se o fetch falhar
function loadUserDataFromLocalStorage() {
    const userData = JSON.parse(localStorage.getItem('userData')) || {
        nome: '',
        email: '',
        telefone: '',
        dataNasc: ''
    };

    document.getElementById('nome').value = userData.nome;
    document.getElementById('email').value = userData.email;
    document.getElementById('telefone').value = userData.telefone;
    document.getElementById('data-nasc').value = userData.dataNasc;

    const displayNameEl = document.getElementById('display-name');
    if (displayNameEl) {
        displayNameEl.textContent = userData.nome || 'Nome do Usuário';
    }
    updateAvatar(userData.nome);
    updateUserInfo(userData.dataNasc);
}

// Função de fallback para carregar a pontuação do localStorage
function loadLastQuizScoreFromLocalStorage() {
    const lastQuizScore = localStorage.getItem('lastQuizScore') || '0'; // Default para 0 se não houver
    document.getElementById('last-quiz-score').textContent = lastQuizScore + '%';
}


function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (validateAge()) {
                saveProfile();
            }
        });
    }
}

function updateAvatar(name) {
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.style.backgroundImage = 'none'; // Garante que a imagem de fundo seja removida se houver
    }
    const displayNameEl = document.getElementById('display-name');
    if (displayNameEl) {
        displayNameEl.textContent = name;
    }
}

function saveProfile() {
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        dataNasc: document.getElementById('data-nasc').value
    };

    fetch('../backend/AtualizarPerfil.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(errorData.message || 'Erro ao salvar alterações');
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showNotification('Perfil atualizado com sucesso!', 'success');
            // Após salvar, atualiza o localStorage e a interface com os dados mais recentes
            localStorage.setItem('userData', JSON.stringify(formData));
            updateAvatar(formData.nome);
            updateUserInfo(formData.dataNasc); // Atualiza a idade exibida
            // Opcional: Se o backend retornar o perfil atualizado completo, usar data.user para atualizar tudo
            // fetchAndDisplayUserData(); // Pode ser chamado aqui para garantir que tudo esteja sincronizado
        } else {
            showNotification('Erro: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showNotification('Erro: ' + error.message, 'error');
        console.error("Fetch error:", error);
    });
}

// A função loadLastQuizScore foi removida pois será carregada via fetchAndDisplayUserData

window.resetStats = function () {
    if (confirm('Tem certeza que deseja resetar todas as suas estatísticas? Esta ação não pode ser desfeita.')) {
        fetch('../backend/UpdateQuizScore.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ score: 0 })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('lastQuizScore', 0); // Atualiza localStorage para 0
                document.getElementById('last-quiz-score').textContent = '0%';
                showNotification('Estatísticas resetadas com sucesso!', 'success');
            } else {
                showNotification('Erro ao resetar estatísticas: ' + data.message, 'error');
            }
        })
        .catch(error => {
            showNotification('Erro de rede ao resetar estatísticas.', 'error');
            console.error("Reset stats fetch error:", error);
        });
    }
}

window.deleteAccount = function () {
    const confirmation = prompt('Para excluir sua conta, digite "EXCLUIR" (em maiúsculas):');
    if (confirmation === 'EXCLUIR') {
        if (confirm('Esta ação é irreversível. Tem certeza absoluta?')) {
            fetch('../backend/delete_account.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirm: 'EXCLUIR' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.clear();
                    showNotification('Conta excluída. Você será redirecionado...', 'error');
                    setTimeout(() => {
                        window.location.href = '../Html/cadastro.html';
                    }, 3000);
                } else {
                    showNotification('Erro ao excluir conta: ' + data.message, 'error');
                }
            })
            .catch(error => {
                showNotification('Erro de rede ao excluir conta.', 'error');
                console.error("Delete account fetch error:", error);
            });
        }
    } else if (confirmation !== null) {
        showNotification('Texto incorreto. Conta não foi excluída.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease forwards;
        background: ${type === 'success' ? 'var(--cor6)' : type === 'error' ? '#dc2626' : 'var(--cor1)'};
    `;
    notification.textContent = message;

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

function calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// A função updateUserInfo agora aceita a data de nascimento diretamente
function updateUserInfo(birthDate) {
    const avatarInfoDiv = document.querySelector('.avatar-info');
    if (birthDate && avatarInfoDiv) {
        const existingAgeDisplay = avatarInfoDiv.querySelector('p');
        if (existingAgeDisplay) {
            existingAgeDisplay.remove();
        }

        const age = calculateAge(birthDate);
        const ageDisplay = document.createElement('p');
        ageDisplay.textContent = `Idade: ${age} anos`;
        ageDisplay.style.color = 'var(--corLetra2)';
        ageDisplay.style.fontSize = '0.9rem';
        avatarInfoDiv.appendChild(ageDisplay);
    }
}

const phoneInput = document.getElementById('telefone');
if (phoneInput && typeof IMask !== 'undefined') {
    IMask(phoneInput, { mask: '(00) 00000-0000' });
}

function validateAge() {
    const birthDateInput = document.getElementById('data-nasc');
    if (birthDateInput && birthDateInput.value) {
        const birthDate = birthDateInput.value;
        const age = calculateAge(birthDate);
        if (age < 13) {
            showNotification('Idade mínima de 13 anos para usar o FormStudio!', 'error');
            return false;
        }
    }
    return true;
}

window.updateLastQuizScore = function (score) {
    localStorage.setItem('lastQuizScore', score);
    document.getElementById('last-quiz-score').textContent = score + '%';
};