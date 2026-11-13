const key = 'najmul-portfolio-updates-v1';
const form = document.querySelector('#log-form');
const entries = document.querySelector('#entries');
const notice = document.querySelector('#notice');
const fields = ['title', 'type', 'detail', 'date'];

function isEntry(item) {
  return item !== null && typeof item === 'object' &&
    fields.every(field => typeof item[field] === 'string' && item[field].trim() !== '');
}

function read() {
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('Invalid saved updates');
  return data;
}

function render() {
  let all;
  try {
    all = read();
  } catch {
    notice.textContent = 'Could not read saved updates. Check browser storage settings or import a valid backup.';
    return;
  }
  renderSavedProjects(all);
  entries.replaceChildren();
  for (const [index, item] of all.entries()) {
    const card = document.createElement('article');
    card.className = 'entry';
    const meta = document.createElement('small');
    meta.textContent = `${item.type} · ${item.date}`;
    const title = document.createElement('h3');
    title.textContent = item.title;
    const detail = document.createElement('p');
    detail.textContent = item.detail;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${item.title}`);
    remove.onclick = () => {
      try {
        const current = read();
        // Refresh stale cards instead of deleting another tab's changed update.
        if (JSON.stringify(current) !== JSON.stringify(all)) {
          render();
          notice.textContent = 'Updates changed in another tab. Please select the update to remove again.';
          return;
        }
        current.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(current));
        render();
        notice.textContent = 'Update removed.';
      } catch {
        notice.textContent = 'Could not remove the update. Check your browser storage settings.';
      }
    };
    card.append(meta, title, detail, remove);
    entries.append(card);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const title = form.querySelector('#entry-title').value.trim();
  const detail = form.querySelector('#entry-detail').value.trim();
  if (!title || !detail) {
    notice.textContent = 'Enter a title and details containing more than spaces.';
    return;
  }
  try {
    const all = read();
    all.unshift({
      title,
      type: form.querySelector('#entry-type').value,
      detail,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    localStorage.setItem(key, JSON.stringify(all));
    form.reset();
    render();
    notice.textContent = 'Update saved in this browser.';
  } catch {
    notice.textContent = 'Could not save. Check browser storage settings and saved updates, or import a valid backup.';
  }
});

document.querySelector('#export').onclick = () => {
  let url;
  let link;
  try {
    const blob = new Blob([JSON.stringify(read(), null, 2)], { type: 'application/json' });
    url = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio-progress-backup.json';
    document.body.append(link);
    link.click();
    notice.textContent = 'Backup download requested.';
  } catch {
    notice.textContent = 'Could not export. Check browser storage settings and saved updates.';
  } finally {
    if (link) link.remove();
    // Allow the browser to start reading the download before releasing its URL.
    if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

document.querySelector('#import').onchange = async event => {
  const input = event.target;
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('Invalid backup');
    const clean = data.map(item => Object.fromEntries(fields.map(field => [field, item[field]])));
    localStorage.setItem(key, JSON.stringify(clean));
    render();
    notice.textContent = 'Backup imported. Previous local updates were replaced.';
  } catch {
    notice.textContent = 'Could not import. Choose a valid portfolio JSON backup and check browser storage settings.';
  } finally {
    input.value = '';
  }
};

window.addEventListener('storage', event => {
  if (event.key === key || event.key === null) render();
});


// Responsive navigation keeps every section reachable on smaller screens.
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('is-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('header')) closeMenu();
});
window.matchMedia('(min-width: 851px)').addEventListener('change', closeMenu);

const getProjectCards = () => [...document.querySelectorAll('.project-grid [data-project]')];
const projectDialog = document.querySelector('#project-dialog');
const passwordDemo = document.querySelector('#password-demo');
const passwordInput = document.querySelector('#demo-password');
const passwordToggle = document.querySelector('#toggle-password');
const passwordMeter = document.querySelector('#password-meter');
const passwordFeedback = document.querySelector('#password-feedback');
const projectNotes = {
  proxy: ['The idea', 'Explore how a Flask middleware layer can inspect incoming requests for suspicious patterns before they reach an application.', 'Learning focus', 'Request handling, SQL injection and XSS patterns, and the limits of pattern-based detection.'],
  eventify: ['The idea', 'Bring event creation, browsing and deletion into a university web application backed by PHP and MySQL.', 'Learning focus', 'Connecting a browser interface to a backend and understanding how application data moves between layers.'],
  password: ['The idea', 'Make password characteristics easier to understand through immediate, browser-based feedback.', 'Try the concept', 'Experiment with length and predictable patterns in the local demo below.']
};
function resetPasswordDemo() {
  passwordInput.value = '';
  passwordInput.type = 'password';
  passwordToggle.textContent = 'Show';
  passwordToggle.setAttribute('aria-pressed', 'false');
  passwordMeter.value = 0;
  passwordFeedback.textContent = 'Type an example to explore its strength.';
}
function initialiseProjectCard(card) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'project-open';
  button.textContent = card.dataset.project === 'password' ? 'Try live demo ↗' : 'Explore project ↗';
  button.setAttribute('aria-label', `${button.textContent} — ${card.querySelector('h3').textContent}`);
  button.setAttribute('aria-haspopup', 'dialog');
  card.querySelector('.project-info').append(button);
  button.addEventListener('click', () => {
    resetPasswordDemo();
    document.querySelector('#dialog-title').textContent = card.querySelector('h3').textContent;
    document.querySelector('#dialog-description').textContent = card.querySelector('.project-info p').textContent;
    document.querySelector('#dialog-tags').replaceChildren(...[...card.querySelectorAll('.tags span')].map(tag => tag.cloneNode(true)));
    const context = document.querySelector('#project-context');
    context.replaceChildren();
    (projectNotes[card.dataset.project] || ['Project details', card.querySelector('.project-info p').textContent]).forEach((text, index) => {
      const element = document.createElement(index % 2 === 0 ? 'h3' : 'p');
      element.textContent = text;
      context.append(element);
    });
    passwordDemo.hidden = card.dataset.project !== 'password';
    projectDialog.showModal();
    document.body.classList.add('dialog-open');
  });
}
document.querySelector('#close-dialog').addEventListener('click', () => projectDialog.close());
projectDialog.addEventListener('click', event => {
  const bounds = projectDialog.getBoundingClientRect();
  if (event.target === projectDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) projectDialog.close();
});
projectDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  resetPasswordDemo();
});
document.querySelector('#dialog-contact').addEventListener('click', () => projectDialog.close());

function applyProjectFilter() {
  const cards = getProjectCards();
  const active = document.querySelector('[data-filter][aria-pressed="true"]');
  const filter = active ? active.dataset.filter : 'all';
  cards.forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
  });
  document.querySelector('[data-filter="all"] span').textContent = String(cards.length).padStart(2, '0');
  document.querySelector('#project-count').textContent = `Showing ${cards.filter(card => !card.hidden).length} projects`;
}

function renderSavedProjects(all) {
  const grid = document.querySelector('.project-grid');
  grid.querySelectorAll('[data-saved-project]').forEach(card => card.remove());
  const template = grid.querySelector('[data-project="eventify"]');
  all.filter(item => item.type === 'Project').forEach((item, index) => {
    const card = template.cloneNode(true);
    card.dataset.project = 'saved';
    card.dataset.savedProject = 'true';
    card.dataset.category = 'other';
    card.hidden = false;
    card.querySelector('.project-open')?.remove();
    const visual = card.querySelector('.project-visual');
    visual.replaceChildren();
    const top = document.createElement('div');
    top.className = 'visual-top';
    const number = document.createElement('span');
    number.textContent = `PROJECT ${String(index + 4).padStart(2, '0')}`;
    const date = document.createElement('span');
    date.textContent = item.date;
    top.append(number, date);
    const symbol = document.createElement('div');
    symbol.className = 'proxy-diagram';
    symbol.textContent = '{ }';
    visual.append(top, symbol);
    card.querySelector('.project-type').textContent = 'PROJECT';
    card.querySelector('h3').textContent = item.title;
    card.querySelector('.project-info p').textContent = item.detail;
    const tag = document.createElement('span');
    tag.textContent = 'Project';
    card.querySelector('.tags').replaceChildren(tag);
    initialiseProjectCard(card);
    grid.append(card);
  });
  applyProjectFilter();
}

getProjectCards().forEach(initialiseProjectCard);
for (const button of document.querySelectorAll('[data-filter]')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    applyProjectFilter();
  });
}
passwordToggle.addEventListener('click', () => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  passwordToggle.textContent = show ? 'Hide' : 'Show';
  passwordToggle.setAttribute('aria-pressed', String(show));
});
passwordInput.addEventListener('input', () => {
  const value = passwordInput.value;
  if (!value) {
    passwordMeter.value = 0;
    passwordFeedback.textContent = 'Type an example to explore its strength.';
    return;
  }
  const predictable = /password|qwerty|1234|letmein|admin/i.test(value) || /^(.)\1+$/.test(value);
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(pattern => pattern.test(value)).length;
  let score = value.length < 8 ? 1 : value.length < 12 ? 2 : value.length < 16 ? 3 : 4;
  if (value.length < 16 && variety < 2) score = Math.min(score, 2);
  if (predictable) score = 1;
  passwordMeter.value = score;
  const label = ['','Weak','Fair','Good','Stronger'][score];
  passwordFeedback.textContent = `${label} · ${value.length} characters. ${predictable ? 'Avoid common words, sequences and repeated characters.' : value.length < 16 ? 'Try a longer, unique passphrase.' : 'Use a unique password for each account; length alone cannot identify predictable phrases.'}`;
});

// Highlight the section being read and reveal content once, respecting reduced motion.
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(items => {
    const visible = items.filter(item => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    navigation.querySelectorAll('a').forEach(link => {
      if (link.hash === `#${visible[0].target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-10% 0px -45% 0px', threshold: [0, 0.2, 0.5] });
  document.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(items => {
      items.forEach(item => {
        if (item.isIntersecting) {
          item.target.classList.add('is-visible');
          revealObserver.unobserve(item.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.skill-card, .timeline-item, .section-top').forEach(element => {
      element.classList.add('reveal');
      revealObserver.observe(element);
    });
  }
}
let scrollPending = false;
function updateProgress() {
  const range = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector('.scroll-progress').style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`;
  scrollPending = false;
}
window.addEventListener('scroll', () => {
  if (!scrollPending) {
    scrollPending = true;
    requestAnimationFrame(updateProgress);
  }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

projectDialog.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.preventDefault();
    projectDialog.close();
  }
});


// This static site's editing tools are available only in a local file preview.
// This is a UI restriction, not authentication; hosted owner access needs a backend.
const journeyEditor = document.querySelector('#journey-editor');
if (window.location.protocol === 'file:') {
  journeyEditor.hidden = false;
  journeyEditor.closest('.journey-layout').classList.add('has-local-editor');
}

// Render saved entries after project controls have been initialised.

render();
