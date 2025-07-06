document.addEventListener('DOMContentLoaded', function () {
    const usernameSpan = document.getElementById('username');
    if (usernameSpan) {
    }

    loadUserData();
    setupEventListeners();
    updateUserInfo();
    loadLastQuizScore();
});

function loadUserData() {
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
        avatarEl.style.backgroundImage = 'none';
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
            localStorage.setItem('userData', JSON.stringify(formData));
            updateAvatar(formData.nome);
        } else {
            showNotification('Erro: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showNotification('Erro: ' + error.message, 'error');
        console.error("Fetch error:", error);
    });
}

function loadLastQuizScore() {
    const lastQuizScore = localStorage.getItem('lastQuizScore') || '85';
    document.getElementById('last-quiz-score').textContent = lastQuizScore + '%';
}

window.resetStats = function () {
    if (confirm('Tem certeza que deseja resetar todas as suas estatísticas? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('lastQuizScore');
        document.getElementById('last-quiz-score').textContent = '0%';
        showNotification('Estatísticas resetadas com sucesso!', 'success');
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
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function updateUserInfo() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const avatarInfoDiv = document.querySelector('.avatar-info');
    if (userData && userData.dataNasc && avatarInfoDiv) {
        const existingAgeDisplay = avatarInfoDiv.querySelector('p');
        if (existingAgeDisplay) {
            existingAgeDisplay.remove();
        }

        const age = calculateAge(userData.dataNasc);
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