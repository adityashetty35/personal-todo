(() => {
  const TZ = 'Asia/Kolkata';
  const $ = (sel, el=document) => el.querySelector(sel);

  function escapeHTML(str){
    return str.replace(/[&<>"']/g, m => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":"&#39;" }[m]
    ));
  }
  function formatISTTime(d=new Date()){
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ, hour:'numeric', minute:'2-digit', hour12:true
    }).formatToParts(d);
    const hh = parts.find(p=>p.type==='hour')?.value ?? '';
    const mm = parts.find(p=>p.type==='minute')?.value ?? '';
    const ap = (parts.find(p=>p.type==='dayPeriod')?.value ?? '').toUpperCase();
    return `${hh}:${mm} ${ap}`.trim();
  }
  function formatISTDateLine(d=new Date()){
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ, weekday:'long', month:'long', day:'numeric'
    }).format(d);
  }
  function formatISTStamp(isoString){
    const d = isoString ? new Date(isoString) : new Date();
    const time = new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ, hour:'numeric', minute:'2-digit', hour12:true
    }).format(d).toUpperCase();
    const date = new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ, weekday:'short', day:'2-digit', month:'short', year:'numeric'
    }).format(d);
    return `Added ${time} · ${date} IST`;
  }

  const clockEl = $('#clock');
  const dateEl  = $('#dateLine');
  function tick(){
    clockEl.textContent = formatISTTime();
    dateEl.textContent  = formatISTDateLine();
  }
  tick(); setInterval(tick, 1000);

  const themeBtn = $('#themeBtn');
  function themeIcon(theme){
    if(theme === 'dark'){
      return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.64 13A9 9 0 0 1 11 2.36 9 9 0 1 0 21.64 13z"></path></svg>`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>`;
  }
  function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clock-ist-theme', theme);
    themeBtn.innerHTML = themeIcon(theme);
    themeBtn.setAttribute('aria-pressed', theme === 'dark');
    themeBtn.title = theme === 'dark' ? 'Switch to light' : 'Switch to dark';
  }
  const savedTheme = localStorage.getItem('clock-ist-theme');
  const prefersDark = matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme ?? (prefersDark ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  const listEl = $('#taskList');
  const inputEl = $('#taskInput');
  const addBtn  = $('#addBtn');

  let tasks = [];
  try { tasks = JSON.parse(localStorage.getItem('clock-ist-tasks') || '[]'); }
  catch { tasks = []; }

  function saveTasks(){
    localStorage.setItem('clock-ist-tasks', JSON.stringify(tasks));
  }

  function render(){
    listEl.innerHTML = '';

    const active = tasks.filter(t => !t.completed)
                        .sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    const done   = tasks.filter(t => t.completed)
                        .sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
    const ordered = [...active, ...done];

    ordered.forEach((t) => {
      const li = document.createElement('li');
      li.className = 'task' + (t.completed ? ' completed' : '');
      li.setAttribute('data-id', t.id);

      li.innerHTML = `
        <input type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark complete">
        <div>
          <div class="title">${escapeHTML(t.text)}</div>
          <small>${formatISTStamp(t.createdAt)}</small>
        </div>
        <button class="delete-btn" aria-label="Delete task">&times;</button>
      `;

      const box = li.querySelector('input');
      box.addEventListener('change', () => {
        t.completed = box.checked;
        saveTasks();
        render();
      });

      const delBtn = li.querySelector('.delete-btn');
      delBtn.addEventListener('click', () => {
        tasks = tasks.filter(x => x.id !== t.id);
        saveTasks();
        render();
      });

      listEl.appendChild(li);
    });
  }

  function addTask(){
    const text = inputEl.value.trim();
    if(!text) { inputEl.focus(); return; }
    const now = new Date();
    const id  = (crypto?.randomUUID?.() || ('t_' + Date.now().toString(36)));
    tasks.unshift({ id, text, completed:false, createdAt: now.toISOString() });
    saveTasks(); render();
    inputEl.value = ''; inputEl.focus();
  }

  addBtn.addEventListener('click', addTask);
  inputEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') addTask(); });

  render();
})();
