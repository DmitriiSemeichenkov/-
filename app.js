const monthTitle = document.getElementById('monthTitle');
const calendarGrid = document.getElementById('calendarGrid');
const vacationList = document.getElementById('vacationList');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const clearAllBtn = document.getElementById('clearAll');

const STORAGE_KEY = 'vacationDates';
const vacationDates = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

let viewDate = new Date();

const ruFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function dateToKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function saveVacationDates() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...vacationDates].sort()));
}

function renderVacationList() {
  vacationList.innerHTML = '';

  const sorted = [...vacationDates].sort();
  if (sorted.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Пока нет отмеченных отпускных дней';
    vacationList.append(empty);
    return;
  }

  for (const dateKey of sorted) {
    const item = document.createElement('li');
    const date = new Date(`${dateKey}T00:00:00`);
    item.textContent = ruFormatter.format(date);
    vacationList.append(item);
  }
}

function toggleVacation(dateKey) {
  if (vacationDates.has(dateKey)) {
    vacationDates.delete(dateKey);
  } else {
    vacationDates.add(dateKey);
  }

  saveVacationDates();
  renderCalendar();
  renderVacationList();
}

function renderCalendar() {
  calendarGrid.innerHTML = '';

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthTitle.textContent = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month, 1));

  const firstDay = new Date(year, month, 1);
  const startDayIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    calendarGrid.append(createDayButton(date, true));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarGrid.append(createDayButton(date, false));
  }

  const cellsNeeded = 42;
  const currentCells = calendarGrid.childElementCount;
  for (let day = 1; day <= cellsNeeded - currentCells; day++) {
    const date = new Date(year, month + 1, day);
    calendarGrid.append(createDayButton(date, true));
  }
}

function createDayButton(date, isOtherMonth) {
  const button = document.createElement('button');
  button.className = 'day-btn';
  button.type = 'button';

  const dateKey = dateToKey(date);
  const todayKey = dateToKey(new Date());

  if (isOtherMonth) {
    button.classList.add('other-month');
  }
  if (dateKey === todayKey) {
    button.classList.add('today');
  }
  if (vacationDates.has(dateKey)) {
    button.classList.add('vacation');
  }

  const dayLabel = document.createElement('span');
  dayLabel.className = 'day-label';
  dayLabel.textContent = String(date.getDate());
  button.append(dayLabel);

  if (vacationDates.has(dateKey)) {
    const chip = document.createElement('span');
    chip.className = 'vacation-chip';
    chip.textContent = 'Отпуск';
    button.append(chip);
  }

  button.addEventListener('click', () => toggleVacation(dateKey));
  return button;
}

prevMonthBtn.addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  renderCalendar();
});

clearAllBtn.addEventListener('click', () => {
  vacationDates.clear();
  saveVacationDates();
  renderCalendar();
  renderVacationList();
});

renderCalendar();
renderVacationList();
