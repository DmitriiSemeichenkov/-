const STORAGE_KEY = 'vacationPlannerDataV2';
const LIMITS = { main: 28, extra: 6 };

const state = loadState();
let viewDate = new Date();

const el = {
  employeeModal: document.getElementById('employeeModal'),
  employeeForm: document.getElementById('employeeForm'),
  employeeName: document.getElementById('employeeName'),
  employeeBanner: document.getElementById('employeeBanner'),
  periodForm: document.getElementById('periodForm'),
  vacationType: document.getElementById('vacationType'),
  startDate: document.getElementById('startDate'),
  endDate: document.getElementById('endDate'),
  validationMessage: document.getElementById('validationMessage'),
  prevMonth: document.getElementById('prevMonth'),
  nextMonth: document.getElementById('nextMonth'),
  monthTitle: document.getElementById('monthTitle'),
  calendarGrid: document.getElementById('calendarGrid'),
  vacationList: document.getElementById('vacationList'),
  totalsText: document.getElementById('totalsText'),
  clearAll: document.getElementById('clearAll'),
  exportXlsx: document.getElementById('exportXlsx'),
};

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { employeeName: '', periods: [], esvPeriodId: null };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      employeeName: parsed.employeeName || '',
      periods: Array.isArray(parsed.periods) ? parsed.periods : [],
      esvPeriodId: parsed.esvPeriodId || null,
    };
  } catch {
    return { employeeName: '', periods: [], esvPeriodId: null };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysInclusive(start, end) {
  const ms = toDate(end) - toDate(start);
  return Math.floor(ms / 86400000) + 1;
}

function formatDate(dateKey) {
  return new Intl.DateTimeFormat('ru-RU').format(toDate(dateKey));
}

function typeLabel(type) {
  return type === 'main' ? 'Основной' : 'Дополнительный';
}

function sumDays(type, periods = state.periods) {
  return periods.filter((p) => p.type === type).reduce((acc, p) => acc + daysInclusive(p.start, p.end), 0);
}

function hasIntersection(a, b) {
  return !(a.end < b.start || a.start > b.end);
}

function validateRules(periods) {
  const main = periods.filter((p) => p.type === 'main').map((p) => daysInclusive(p.start, p.end));
  const extra = periods.filter((p) => p.type === 'extra').map((p) => daysInclusive(p.start, p.end));
  const mainTotal = main.reduce((a, b) => a + b, 0);
  const extraTotal = extra.reduce((a, b) => a + b, 0);

  if (mainTotal > LIMITS.main) return 'Основной отпуск не может превышать 28 дней.';
  if (extraTotal > LIMITS.extra) return 'Дополнительный отпуск не может превышать 6 дней.';

  if (main.some((d) => d < 14 && d % 7 !== 0)) {
    return 'Периоды основного отпуска (кроме периода 14+ дней) должны быть кратны 7 дням.';
  }
  if (extra.some((d) => d % 3 !== 0)) {
    return 'Каждый период дополнительного отпуска должен быть кратен 3 дням.';
  }

  return '';
}

function validateForExport() {
  if (!state.employeeName) return 'Введите ФИО сотрудника.';
  const mainTotal = sumDays('main');
  const extraTotal = sumDays('extra');
  const mainDays = state.periods.filter((p) => p.type === 'main').map((p) => daysInclusive(p.start, p.end));

  if (mainTotal !== LIMITS.main) return 'Для выгрузки основной отпуск должен быть ровно 28 дней.';
  if (extraTotal !== LIMITS.extra) return 'Для выгрузки дополнительный отпуск должен быть ровно 6 дней.';
  if (!mainDays.some((d) => d >= 14)) return 'В основном отпуске один период должен быть не менее 14 дней.';
  if (!state.esvPeriodId) return 'Назначьте метку ЕСВ на один из периодов.';

  const ruleError = validateRules(state.periods);
  return ruleError;
}

function updateHeader() {
  el.employeeBanner.textContent = state.employeeName ? `Сотрудник: ${state.employeeName}` : 'Сотрудник не указан';
}

function renderCalendar() {
  el.calendarGrid.innerHTML = '';
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  el.monthTitle.textContent = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(y, m, 1));

  const firstDay = new Date(y, m, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const prevDays = new Date(y, m, 0).getDate();
  for (let i = offset - 1; i >= 0; i--) {
    el.calendarGrid.append(buildDayBtn(new Date(y, m - 1, prevDays - i), true));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    el.calendarGrid.append(buildDayBtn(new Date(y, m, d), false));
  }
  while (el.calendarGrid.childElementCount < 42) {
    const idx = el.calendarGrid.childElementCount - (offset + daysInMonth) + 1;
    el.calendarGrid.append(buildDayBtn(new Date(y, m + 1, idx), true));
  }
}

function periodForDate(dateKey) {
  return state.periods.find((p) => p.start <= dateKey && p.end >= dateKey);
}

function buildDayBtn(date, otherMonth) {
  const btn = document.createElement('div');
  btn.className = 'day-btn';
  const key = toKey(date);
  const today = toKey(new Date());
  const period = periodForDate(key);

  if (otherMonth) btn.classList.add('other-month');
  if (key === today) btn.classList.add('today');
  if (period) btn.classList.add(period.type);

  const top = document.createElement('div');
  top.textContent = String(date.getDate());
  btn.append(top);

  if (period) {
    const badges = document.createElement('div');
    badges.className = 'badges';

    const typeBadge = document.createElement('span');
    typeBadge.className = `badge ${period.type}`;
    typeBadge.textContent = period.type === 'main' ? 'Осн.' : 'Доп.';
    badges.append(typeBadge);

    if (state.esvPeriodId === period.id) {
      const esvBadge = document.createElement('span');
      esvBadge.className = 'badge esv';
      esvBadge.textContent = 'ЕСВ';
      badges.append(esvBadge);
    }
    btn.append(badges);
  }

  return btn;
}

function renderList() {
  el.vacationList.innerHTML = '';
  const sorted = [...state.periods].sort((a, b) => a.start.localeCompare(b.start));

  if (!sorted.length) {
    const li = document.createElement('li');
    li.textContent = 'Пока нет периодов.';
    el.vacationList.append(li);
  }

  sorted.forEach((period) => {
    const li = document.createElement('li');
    li.className = 'vacation-item';

    const days = daysInclusive(period.start, period.end);
    const info = document.createElement('div');
    info.innerHTML = `<strong>${typeLabel(period.type)}</strong>: ${formatDate(period.start)} — ${formatDate(period.end)} (${days} дн.)`;

    const meta = document.createElement('div');
    meta.className = 'item-meta';
    meta.textContent = state.esvPeriodId === period.id ? 'Метка: ЕСВ' : 'Без метки ЕСВ';
    info.append(meta);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const setEsv = document.createElement('button');
    setEsv.type = 'button';
    setEsv.className = `list-btn ${state.esvPeriodId === period.id ? 'active' : ''}`;
    setEsv.textContent = 'ЕСВ';
    setEsv.onclick = () => {
      state.esvPeriodId = period.id;
      saveState();
      renderAll();
    };

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'list-btn';
    remove.textContent = 'Удалить';
    remove.onclick = () => {
      state.periods = state.periods.filter((p) => p.id !== period.id);
      if (state.esvPeriodId === period.id) state.esvPeriodId = null;
      saveState();
      renderAll();
    };

    actions.append(setEsv, remove);
    li.append(info, actions);
    el.vacationList.append(li);
  });

  el.totalsText.textContent = `Итого: основной ${sumDays('main')}/28, дополнительный ${sumDays('extra')}/6.`;
}

function showMessage(text = '') {
  el.validationMessage.textContent = text;
}

function addPeriod(evt) {
  evt.preventDefault();
  const type = el.vacationType.value;
  const start = el.startDate.value;
  const end = el.endDate.value;

  if (!start || !end) return showMessage('Заполните даты начала и конца.');
  if (start > end) return showMessage('Дата начала не может быть больше даты окончания.');

  const candidate = { id: crypto.randomUUID(), type, start, end };

  if (state.periods.some((p) => hasIntersection(p, candidate))) {
    return showMessage('Новый период пересекается с существующим.');
  }

  const next = [...state.periods, candidate];
  const ruleError = validateRules(next);
  if (ruleError) return showMessage(ruleError);

  if (sumDays(type, next) > LIMITS[type]) {
    return showMessage(`Превышен лимит для типа "${typeLabel(type)}".`);
  }

  state.periods = next;
  saveState();
  showMessage('');
  el.periodForm.reset();
  renderAll();
}

function exportXlsx() {
  const err = validateForExport();
  if (err) return showMessage(err);

  const sorted = [...state.periods].sort((a, b) => a.start.localeCompare(b.start));
  const periodsText = sorted
    .map((p) => `${typeLabel(p.type)}: ${formatDate(p.start)} - ${formatDate(p.end)} (${daysInclusive(p.start, p.end)} дн.)`)
    .join('; ');

  const esv = sorted.find((p) => p.id === state.esvPeriodId);
  const esvText = `${formatDate(esv.start)} - ${formatDate(esv.end)} (${typeLabel(esv.type)})`;

  const rows = [{
    'ФИО': state.employeeName,
    'Периоды отпусков': periodsText,
    'Период с меткой ЕСВ': esvText,
  }];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Отпуска');
  XLSX.writeFile(wb, `otpusk_${state.employeeName.replaceAll(' ', '_')}.xlsx`);

  showMessage('Файл .xlsx успешно сформирован.');
}

function renderAll() {
  updateHeader();
  renderCalendar();
  renderList();
}

el.employeeForm.addEventListener('submit', (evt) => {
  evt.preventDefault();
  const name = el.employeeName.value.trim();
  if (name.length < 5) return;
  state.employeeName = name;
  saveState();
  el.employeeModal.classList.add('hidden');
  renderAll();
});

el.periodForm.addEventListener('submit', addPeriod);
el.prevMonth.addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});
el.nextMonth.addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});
el.clearAll.addEventListener('click', () => {
  state.periods = [];
  state.esvPeriodId = null;
  saveState();
  showMessage('');
  renderAll();
});
el.exportXlsx.addEventListener('click', exportXlsx);

if (state.employeeName) {
  el.employeeName.value = state.employeeName;
  el.employeeModal.classList.add('hidden');
}

renderAll();
