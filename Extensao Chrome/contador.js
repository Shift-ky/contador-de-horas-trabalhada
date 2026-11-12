if (document.querySelector('meta[name="contador-horas-sync"]')) {
  const key = 'contador-horas.v1';
  async function update(pontos) {
    if (!pontos || !Object.keys(pontos).length) return;
    const data = JSON.parse(localStorage.getItem(key)) || { days: {}, goal: '08:00' };
    const days = { ...data.days, ...pontos };
    const next = JSON.stringify({ ...data, days });
    if (next === JSON.stringify(data)) return;
    localStorage.setItem(key, next);
    document.dispatchEvent(new Event('contador-horas-sync'));
  }

  document.addEventListener('contador-horas-clear', async event => {
    const month = event.detail;
    if (!month) {
      await chrome.storage.local.remove('pontos');
      return;
    }
    const { pontos = {} } = await chrome.storage.local.get('pontos');
    for (const date of Object.keys(pontos)) {
      if (date.startsWith(month + '-')) delete pontos[date];
    }
    await chrome.storage.local.set({ pontos });
  });
  chrome.storage.local.get('pontos').then(({ pontos }) => update(pontos));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.pontos) update(changes.pontos.newValue);
  });
}
