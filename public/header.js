async function loadHeader() {
  try {
    const res = await fetch('header.html');
    const html = await res.text();
    document.getElementById('header-placeholder').innerHTML = html;
  } catch (err) {
    console.error('Error cargando cabecera:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadHeader);
