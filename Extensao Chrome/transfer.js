const status = document.getElementById('status');
const copy = document.getElementById('copy');
const backup = document.getElementById('backup');
chrome.storage.local.get('pontos').then(({ pontos = {} }) => {
  const records = Object.values(pontos);
  status.textContent = records.length + ' dia(s) disponível(is).';
  copy.disabled = !records.length;
  copy.onclick = async () => {
    const payload = JSON.stringify({ formato: 'contador-horas-pontos', registros: records });
    try {
      await navigator.clipboard.writeText(payload);
      status.textContent = 'Copiado. Cole no Contador de Horas.';
    } catch {
      backup.hidden = false;
      backup.value = payload;
      backup.select();
      status.textContent = 'Pressione Ctrl+C para copiar os registros selecionados.';
    }
  };
}).catch(() => { status.textContent = 'Não foi possível ler os registros da extensão.'; });
