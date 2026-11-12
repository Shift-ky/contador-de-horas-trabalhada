const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const months = Array.from({ length: 12 }, (_, month) =>
  normalize(new Date(2026, month, 1).toLocaleDateString('pt-BR', { month: 'long' })));
const columns = ['trabalhadas', 'justificadas', 'excedentes', 'interjornada', 'faltantes', 'noturnas', 'folga'];
const clean = value => normalize(value).trim();
const duration = value => {
  const match = value.trim().match(/^(\d+):([0-5]\d):([0-5]\d)$/);
  return match ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) : null;
};

function readRows() {
  const reference = [...document.querySelectorAll('input, select, [role=combobox], [contenteditable]')].map(input => clean(input.value || input.innerText || ''))
    .map(value => value.match(/^([a-z]+) de (\d{4})$/))
    .find(match => match && months.includes(match[1]));
  if (!reference) return [];
  const [, monthName, year] = reference;
  const month = months.indexOf(monthName) + 1;
  for (const grid of document.querySelectorAll('.dx-datagrid')) {
    const headers = [...grid.querySelectorAll('.dx-datagrid-headers [aria-colindex][aria-label]')];
    const columnIds = ['data', 'tipo', ...columns].map(name => headers
      .find(cell => clean(cell.getAttribute('aria-label')) === 'coluna ' + name)?.getAttribute('aria-colindex'));
    if (columnIds.some(id => !id)) continue;
    const records = [];
    for (const row of grid.querySelectorAll('.dx-datagrid-rowsview tr')) {
      const values = columnIds.map(id => row.querySelector('[aria-colindex="' + id + '"]')?.innerText.trim());
      const [rawDate, rawType, ...totals] = values;
      const match = rawDate?.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
      if (!match || !rawType || Number(match[2]) !== month || (match[3] && match[3] !== year)) continue;
      const seconds = totals.map(value => duration(value ?? ''));
      const type = rawType.replace(/\s+/g, '');
      if (seconds.some(value => value === null) || !seconds.some(Boolean) && /^diadetrabalho$/i.test(type)) continue;
      const date = [year, String(month).padStart(2, '0'), match[1].padStart(2, '0')].join('-');
      records.push({ date, type, values: seconds.map(value => value / 60) });
    }
    if (records.length) return records;
  }
  return [];
}

let lastBatch = '';
let inFlight = false;
async function sync() {
  if (inFlight || location.pathname.replace(/\/$/, '') !== '/private/digital-point/listing') return;
  const rows = readRows();
  const batch = JSON.stringify(rows);
  if (batch === lastBatch) return;
  inFlight = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'pontos', rows });
    if (result?.ok) lastBatch = batch;
  } finally {
    inFlight = false;
  }
}
function check() { sync().catch(error => console.warn('Contador de Horas:', error)); }
check();
setInterval(check, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
