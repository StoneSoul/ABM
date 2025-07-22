async function loadLayout() {
  try {
    const resHeader = await fetch('header.html');
    const htmlHeader = await resHeader.text();
    document.getElementById('header-placeholder').innerHTML = htmlHeader;

    const resFooter = await fetch('footer.html');
    const htmlFooter = await resFooter.text();
    document.getElementById('footer-placeholder').innerHTML = htmlFooter;
  } catch (err) {
    console.error('Error cargando cabecera o pie:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadLayout);