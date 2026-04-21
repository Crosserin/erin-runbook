// Q Branch Records Division · client-side dossier reader

const state = { files: [], currentPath: null, search: '' };

const dom = {
  tree: document.getElementById('tree'),
  search: document.getElementById('search'),
  body: document.getElementById('procBody'),
  title: document.getElementById('procTitle'),
  meta: document.getElementById('procMeta'),
  status: document.getElementById('statusLine'),
};

init();

async function init() {
  try {
    setStatus('retrieving index');
    const r = await fetch('/api/tree');
    if (!r.ok) throw new Error(`tree ${r.status}: ${await r.text()}`);
    const data = await r.json();
    state.files = data.files || [];
    if (state.files.length === 0) {
      setStatus('no procedures on file — add markdown to erin-runbook-data');
      renderTree();
      return;
    }
    setStatus(`${state.files.length} procedures indexed · last refreshed ${new Date(data.fetched_at).toLocaleTimeString()}`);
    renderTree();
    // auto-select first procedure
    openProcedure(state.files[0].path);
  } catch (e) {
    setStatus(`index failure: ${e.message}`);
    dom.body.innerHTML = `<div class="err">Unable to reach the dossier. <br>Runtime PAT may not be configured yet.<br><br><code>${escapeHtml(e.message)}</code></div>`;
  }
}

function renderTree() {
  const q = state.search.toLowerCase();
  const filtered = q ? state.files.filter(f => f.path.toLowerCase().includes(q)) : state.files;

  // Group by top-level folder
  const groups = new Map();
  for (const f of filtered) {
    const parts = f.path.split('/');
    const group = parts.length > 1 ? parts[0] : '_root';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(f);
  }

  dom.tree.innerHTML = '';
  for (const [group, files] of [...groups.entries()].sort()) {
    const section = document.createElement('div');
    section.className = 'tree-group';
    const label = group === '_root' ? 'LOOSE' : group.toUpperCase();
    section.innerHTML = `<div class="tree-group-label">[ ${label} ]</div>`;
    const ul = document.createElement('ul');
    for (const f of files) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'tree-item' + (f.path === state.currentPath ? ' active' : '');
      a.textContent = fileName(f.path);
      a.dataset.path = f.path;
      a.onclick = (e) => { e.preventDefault(); openProcedure(f.path); };
      li.appendChild(a);
      ul.appendChild(li);
    }
    section.appendChild(ul);
    dom.tree.appendChild(section);
  }
  if (filtered.length === 0) {
    dom.tree.innerHTML = '<div class="tree-empty">no matches</div>';
  }
}

async function openProcedure(path) {
  state.currentPath = path;
  renderTree();
  dom.title.textContent = fileName(path);
  dom.meta.textContent = path;
  dom.body.innerHTML = '<div class="loading">decrypting...</div>';

  try {
    const r = await fetch('/api/procedure?path=' + encodeURIComponent(path));
    if (!r.ok) throw new Error(`procedure ${r.status}`);
    const md = await r.text();
    dom.body.innerHTML = renderMarkdown(md);
  } catch (e) {
    dom.body.innerHTML = `<div class="err">retrieval failed: ${escapeHtml(e.message)}</div>`;
  }
}

function fileName(p) {
  return p.split('/').pop().replace(/\.md$/, '').replace(/[-_]/g, ' ');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setStatus(t) { dom.status.textContent = t; }

// Minimal markdown renderer — good enough for runbooks.
// Handles: headings, bold, italic, inline code, fenced code, links, lists, paragraphs, hr.
function renderMarkdown(md) {
  // Strip frontmatter
  md = md.replace(/^---\n[\s\S]*?\n---\n?/, '');

  const lines = md.split('\n');
  const out = [];
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];
  let listBuf = [];
  let listType = null;
  let paraBuf = [];

  const flushPara = () => { if (paraBuf.length) { out.push(`<p>${inline(paraBuf.join(' '))}</p>`); paraBuf = []; } };
  const flushList = () => { if (listBuf.length) { out.push(`<${listType}>${listBuf.map(i => `<li>${inline(i)}</li>`).join('')}</${listType}>`); listBuf = []; listType = null; } };

  for (const raw of lines) {
    if (inCode) {
      if (raw.trim().startsWith('```')) {
        out.push(`<pre><code class="lang-${codeLang}">${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        inCode = false; codeLang = ''; codeBuf = [];
      } else {
        codeBuf.push(raw);
      }
      continue;
    }
    const line = raw.trimEnd();
    if (line.startsWith('```')) { flushPara(); flushList(); inCode = true; codeLang = line.slice(3).trim(); continue; }
    if (/^#{1,6} /.test(line)) {
      flushPara(); flushList();
      const level = line.match(/^#+/)[0].length;
      const text = line.slice(level + 1);
      out.push(`<h${level}>${inline(text)}</h${level}>`);
      continue;
    }
    if (/^(---|___|\*\*\*)$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue; }
    const ul = line.match(/^[-*]\s+(.*)/);
    const ol = line.match(/^(\d+)\.\s+(.*)/);
    if (ul) { flushPara(); if (listType && listType !== 'ul') flushList(); listType = 'ul'; listBuf.push(ul[1]); continue; }
    if (ol) { flushPara(); if (listType && listType !== 'ol') flushList(); listType = 'ol'; listBuf.push(ol[2]); continue; }
    if (line.trim() === '') { flushPara(); flushList(); continue; }
    if (listType) { listBuf[listBuf.length - 1] += ' ' + line; continue; }
    paraBuf.push(line);
  }
  flushPara(); flushList();
  if (inCode) out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  return out.join('\n');
}

function inline(t) {
  // Order matters: code first (to protect from other matches), then links, bold, italic
  t = escapeHtml(t);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
  return t;
}

// Search wiring
dom.search.addEventListener('input', (e) => { state.search = e.target.value; renderTree(); });