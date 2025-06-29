document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("password").value.trim();

  fetch("login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email,
      password: senha
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.sucesso) {
      document.getElementById("mensagem").textContent = "Login realizado com sucesso!";
    } else {
      document.getElementById("mensagem").textContent = data.erro || "Falha no login";
    }
  })
  .catch(error => {
    console.error(error);
    document.getElementById("mensagem").textContent = "Erro ao enviar requisição.";
  });
  window.location.href = "Formulario.html";
});
