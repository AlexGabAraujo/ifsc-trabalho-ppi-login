<?php
session_start();
session_unset();
session_destroy();
// Redirecionar para a página de login
header('Location: ../Html/Login.html'); 
exit();
?>