(function () {
  const form = document.getElementById('loginForm');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        window.location.href = '/index.html';
        return;
      }

      alert('Credenciales incorrectas');
    } catch (error) {
      console.error('Error al intentar iniciar sesión:', error);
      alert('No se pudo procesar la solicitud. Intente nuevamente más tarde.');
    }
  });
})();
