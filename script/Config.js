// script/Config.js
document.addEventListener('DOMContentLoaded', function () {
    // Get username from session (you might need to pass this from PHP if not already available)
    // For now, setting a placeholder or fetching from a conceptual global variable if available
    const usernameSpan = document.getElementById('username');
    if (usernameSpan) {
        // This 'username' needs to be set dynamically, perhaps from a PHP session variable after login
        // For demonstration, let's assume it's "Usuário" or fetched via another means.
        // In a real app, after login, PHP would render this value or send it via an API.
        // Example: usernameSpan.textContent = '<?php echo $_SESSION["user_name"] ?? "Usuário"; ?>'; (if PHP included directly)
        // Or fetch via AJAX: fetch('../backend/get_user_info.php').then(res => res.json()).then(data => { usernameSpan.textContent = data.name; });
    }

    loadUserData();
    setupEventListeners();
    updateUserInfo();
    loadLastQuizScore();
});

function loadUserData() {
    // In a real application, fetch user data from the backend using an authenticated endpoint
    // For now, we're relying on localStorage for populating the form initially.
    // Example of how you would fetch from backend:
    /*
    fetch('../backend/get_user_data.php') // You would need to create this PHP file
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('nome').value = data.userData.nome;
                document.getElementById('email').value = data.userData.email;
                document.getElementById('telefone').value = data.userData.telefone;
                document.getElementById('data-nasc').value = data.userData.dataNasc;
                updateAvatar(data.userData.nome);
            } else {
                console.error("Failed to load user data:", data.message);
            }
        })
        .catch(error => console.error("Error fetching user data:", error));
    */

    // Using localStorage as a fallback/initial example (remove in production if backend is primary)
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

    // The avatar element (user-avatar) is not present in the provided HTML.
    // Make sure you have an element with id="user-avatar" for this to work.
    // For now, directly updating the 'display-name' h4.
    const displayNameEl = document.getElementById('display-name');
    if (displayNameEl) {
        displayNameEl.textContent = userData.nome || 'Nome do Usuário'; // Display the loaded name
    }
    // updateAvatar(userData.nome); // This function assumes an avatar element exists
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

    // The avatar-upload element is not present in the provided HTML.
    // document.getElementById('avatar-upload').addEventListener('change', function (e) {
    //     handleAvatarUpload(e);
    // });
}

function updateAvatar(name) {
    // This function needs an element with id="user-avatar" to operate.
    // It is not present in the provided Html/Config.html.
    // You might need to add: <div id="user-avatar" class="avatar"></div> in your HTML.
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatarEl.textContent = initials;
        avatarEl.style.backgroundImage = 'none';
    }
    const displayNameEl = document.getElementById('display-name');
    if (displayNameEl) {
        displayNameEl.textContent = name; // Update the display name in the profile section
    }
}

// updateAvatarImage and handleAvatarUpload are for avatar functionality not fully in HTML
// If you want avatar upload, add input type="file" id="avatar-upload" and a div id="user-avatar"

function saveProfile() {
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        dataNasc: document.getElementById('data-nasc').value
    };

    // --- CHANGE THIS URL ---
    fetch('../backend/AtualizarPerfil.php', { // Assuming 'backend' is one level up from 'script'
        method: 'POST', // Or PUT, depending on your backend preference (PHP often handles PUT via file_get_contents)
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
            // Update localStorage as a local cache, but source of truth is now backend
            localStorage.setItem('userData', JSON.stringify(formData));
            updateAvatar(formData.nome); // Update avatar display if applicable
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
    const lastQuizScore = localStorage.getItem('lastQuizScore') || '85'; // Keep as is if score is only client-side
    document.getElementById('last-quiz-score').textContent = lastQuizScore + '%';
}

window.resetStats = function () { // Make it global for inline onclick
    if (confirm('Tem certeza que deseja resetar todas as suas estatísticas? Esta ação não pode ser desfeita.')) {
        localStorage.removeItem('lastQuizScore');
        document.getElementById('last-quiz-score').textContent = '0%';
        showNotification('Estatísticas resetadas com sucesso!', 'success');
        // If quiz scores were also in backend, you'd send a request here to reset them.
    }
}

window.deleteAccount = function () { // Make it global for inline onclick
    const confirmation = prompt('Para excluir sua conta, digite "EXCLUIR" (em maiúsculas):');
    if (confirmation === 'EXCLUIR') {
        if (confirm('Esta ação é irreversível. Tem certeza absoluta?')) {
            // --- Send request to backend to delete account ---
            fetch('../backend/delete_account.php', { // You would need to create this PHP file
                method: 'POST', // or DELETE, handled by PHP's file_get_contents("php://input")
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirm: 'EXCLUIR' }) // Send confirmation to backend
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    localStorage.clear(); // Clear local storage after successful backend deletion
                    showNotification('Conta excluída. Você será redirecionado...', 'error');
                    setTimeout(() => {
                        window.location.href = '../Html/cadastro.html'; // Redirect to initial registration
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

    // Define keyframes dynamically or ensure they are in your CSS
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
            document.head.removeChild(style); // Clean up dynamic style
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
    const avatarInfoDiv = document.querySelector('.avatar-info'); // Ensure this div exists in HTML
    if (userData && userData.dataNasc && avatarInfoDiv) {
        // Remove existing age display if any
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

// Mask for phone input
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