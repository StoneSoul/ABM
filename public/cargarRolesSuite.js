// cargarRolesSuite.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('api/usuarios/roles_suite');
    const roles = await res.json();

    const select = document.getElementById('rol_suite');
    select.innerHTML = '<option value="">Seleccione un rol</option>';

    roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.value;
      option.textContent = rol.label;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error al cargar roles:', err);
    const select = document.getElementById('rol_suite');
    select.innerHTML = '<option value="">Error al cargar</option>';
  }
});
