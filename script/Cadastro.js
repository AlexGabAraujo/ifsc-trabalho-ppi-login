window.addEventListener("DOMContentLoaded", () => {
    const telInput = document.getElementById("telefone");
    IMask(telInput, { mask: "(00) 00000-0000" });
});

const form = document.getElementById("cadastro-form");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const dataNasc = document.getElementById("dataNasc").value;
    const telefone = document.getElementById("telefone").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value;
    const perfil = document.getElementById("perfil").value;

    if (nome.length < 3) {
        alert("Por favor, insira um nome válido com pelo menos 3 caracteres.");
        return;
    }
    if (email.length < 10) {
        alert("Por favor, insira um email válido.");
        return;
    }
    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres.");
        return;
    }
    if (!perfil) {
        alert("Selecione um perfil.");
        return;
    }

    const dadosCadastro = {
        nome: nome,
        dataNascimento: dataNasc,
        telefone: telefone,
        email: email,
        senha: senha,
        perfil: perfil
    };

    // simulação de envio
    // substitua pela sua URL real do backend se quiser
    fetch("URL_DO_SEU_BACKEND_AQUI", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosCadastro)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Erro ao enviar os dados");
        }
        return response.json(); // caso o backend retorne algo
    })
    .then(data => {
        alert("Cadastro realizado com sucesso!");
        localStorage.setItem("perfil", perfil);
        if (perfil === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "login.html";
        }
    })
    .catch(error => {
        alert("Erro: " + error.message);
    });
});
