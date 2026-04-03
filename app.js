const sections = [
  {
    title: 'Общая документация',
    path: './docs/README.md',
    description: 'Навигация и правила ведения документации.',
  },
  {
    title: 'Архитектура',
    path: './docs/architecture.md',
    description: 'Описание компонентов, ограничений и потоков данных.',
  },
  {
    title: 'ADR',
    path: './docs/decisions/README.md',
    description: 'Архитектурные решения и их последствия.',
  },
  {
    title: 'Гайды',
    path: './docs/guides/onboarding.md',
    description: 'Обучение и практические инструкции для команды.',
  },
  {
    title: 'Управление требованиями',
    path: './docs/requirements-management.md',
    description: 'Фиксация, согласование и трассируемость требований.',
  },
  {
    title: 'Runbook\'и',
    path: './docs/runbooks/incident-response.md',
    description: 'Регламенты действий в операционных сценариях.',
  },
];

const container = document.getElementById('sections');

for (const section of sections) {
  const card = document.createElement('article');
  card.className = 'section-card';

  const title = document.createElement('h3');
  title.textContent = section.title;

  const description = document.createElement('p');
  description.textContent = section.description;

  const link = document.createElement('a');
  link.href = section.path;
  link.textContent = 'Открыть';
  link.target = '_blank';
  link.rel = 'noreferrer';

  card.append(title, description, link);
  container.append(card);
}
