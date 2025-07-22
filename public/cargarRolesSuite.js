export async function cargarRolesSuite() {
  try {
    const res = await fetch('api/usuarios/roles_suite');
    const roles = await res.json();

    const select = document.getElementById('rol_suite');
    select.innerHTML = '<option value="">Seleccione un rol</option>';

    roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.value;           // ID del rol
      option.textContent = rol.label;     // "1 : Administrador"
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error al cargar roles:', err);
    const select = document.getElementById('rol_suite');
    select.innerHTML = '<option value="">Error al cargar</option>';
  }
}