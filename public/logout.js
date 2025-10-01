document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'btnLogout') {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = 'login.html';
  }
});
