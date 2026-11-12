let queue = Promise.resolve();

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  const url = sender.url && new URL(sender.url);
  if (message.type !== 'pontos' || url?.origin !== 'https://procfit.cosmospro.com.br' ||
      url.pathname.replace(/\/$/, '') !== '/private/digital-point/listing' || !Array.isArray(message.rows)) return;
  queue = queue.catch(() => {}).then(async () => {
    if (!message.rows.length) {
      await chrome.action.setBadgeText({ text: '?' });
      await chrome.action.setTitle({ title: 'Contador de Horas — nenhuma linha reconhecida no portal' });
      return;
    }
    const { pontos = {} } = await chrome.storage.local.get('pontos');
    for (const day of message.rows) pontos[day.date] = day;
    await chrome.storage.local.set({ pontos });
    await chrome.action.setBadgeText({ text: String(message.rows.length) });
    await chrome.action.setTitle({ title: 'Contador de Horas — ' + message.rows.length + ' dias lidos do portal' });
  });
  queue.then(() => reply({ ok: true }), () => reply({ ok: false }));
  return true;
});
