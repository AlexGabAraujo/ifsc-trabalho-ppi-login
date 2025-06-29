 document.addEventListener('DOMContentLoaded', function () {
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

            updateAvatar(userData.nome);

        }

        function setupEventListeners() {
            document.getElementById('profile-form').addEventListener('submit', function (e) {
                e.preventDefault();
                if (validateAge()) {
                    saveProfile();
                }
            });

            document.getElementById('avatar-upload').addEventListener('change', function (e) {
                handleAvatarUpload(e);
            });
        }

        function updateAvatar(name) {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
            const avatarEl = document.getElementById('user-avatar');

            avatarEl.textContent = initials;
            avatarEl.style.backgroundImage = 'none';
        }

        function updateAvatarImage(imageData) {
            const avatarEl = document.getElementById('user-avatar');
            if (imageData) {
                avatarEl.style.backgroundImage = `url(${imageData})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.textContent = ''; // limpa as iniciais
            } else {
                const userData = JSON.parse(localStorage.getItem('userData')) || { nome: '' };
                const initials = userData.nome.split(' ').map(n => n[0]).join('').toUpperCase();
                avatarEl.style.backgroundImage = 'none';
                avatarEl.textContent = initials;
            }
        }

        function saveProfile() {
            const formData = {
                nome: document.getElementById('nome').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value,
                dataNasc: document.getElementById('data-nasc').value
            };

            localStorage.setItem('userData', JSON.stringify(formData));
            updateAvatar(formData.nome);

            showNotification('Perfil atualizado com sucesso!', 'success');
        }

        function handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    localStorage.setItem('userAvatar', e.target.result);
                    updateAvatarImage(e.target.result);
                    showNotification('Avatar atualizado com sucesso!', 'success');
                };
                reader.readAsDataURL(file);
            }
        }

        function loadLastQuizScore() {
            const lastQuizScore = localStorage.getItem('lastQuizScore') || '85';
            document.getElementById('last-quiz-score').textContent = lastQuizScore + '%';
        }

        function resetStats() {
            if (confirm('Tem certeza que deseja resetar todas as suas estatísticas? Esta ação não pode ser desfeita.')) {
                localStorage.removeItem('lastQuizScore');
                document.getElementById('last-quiz-score').textContent = '0%';
                showNotification('Estatísticas resetadas com sucesso!', 'success');
            }
        }

        function deleteAccount() {
            const confirmation = prompt('Para excluir sua conta, digite "EXCLUIR" (em maiúsculas):');
            if (confirmation === 'EXCLUIR') {
                if (confirm('Esta ação é irreversível. Tem certeza absoluta?')) {
                    localStorage.clear();
                    showNotification('Conta excluída. Você será redirecionado...', 'error');
                    setTimeout(() => {
                        window.location.href = 'cadastro-integrado.html';
                    }, 3000);
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
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? 'var(--cor6)' : type === 'error' ? '#dc2626' : 'var(--cor1)'};
    `;
            notification.textContent = message;

            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        document.head.appendChild(style);

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
            if (userData && userData.dataNasc) {
                const age = calculateAge(userData.dataNasc);
                const ageDisplay = document.createElement('p');
                ageDisplay.textContent = `Idade: ${age} anos`;
                ageDisplay.style.color = 'var(--corLetra2)';
                ageDisplay.style.fontSize = '0.9rem';
                document.querySelector('.avatar-info').appendChild(ageDisplay);
            }
        }

        // máscara telefone
        const phoneInput = document.getElementById('telefone');
        if (phoneInput) {
            IMask(phoneInput, { mask: '(00) 00000-0000' });
        }

        function validateAge() {
            const birthDate = document.getElementById('data-nasc').value;
            if (birthDate) {
                const age = calculateAge(birthDate);
                if (age < 13) {
                    showNotification('Idade mínima de 13 anos para usar o FormStudio!', 'error');
                    return false;
                }
            }
            return true;
        }

        // função para atualizar pontuação do quiz
        window.updateLastQuizScore = function (score) {
            localStorage.setItem('lastQuizScore', score);
            document.getElementById('last-quiz-score').textContent = score + '%';
        };