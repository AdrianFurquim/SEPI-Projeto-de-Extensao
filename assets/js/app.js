(() => {
  const DATA_URL = 'assets/json/data.json';
  const ROOT_SEL = '#app'; // container onde os cards vão aparecer

  // keys sessionStorage
  const HOME_OVERRIDE_KEY = 'sepi_home_override_v1';

  // util
  const esc = s => s == null ? '' : String(s);
  const safeText = s => {
    const d = document.createElement('div');
    d.textContent = esc(s);
    return d.innerHTML;
  };

  // normalize: remove acentos, deixar só letras a-z minúsculas
  function makeIdFromName(name = '') {
    const s = String(name).trim().toLowerCase();
    const noAcc = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const onlyLetters = noAcc.replace(/[^a-z0-9]/g, ''); // permitir números caso queira
    return onlyLetters;
  }

  // nova util: normaliza texto para comparação/ordenação (mantém espaços, remove acentos e caracteres especiais)
  function normalizeForSort(str = '') {
    const s = String(str || '').trim().toLowerCase();
    const noAcc = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleaned = noAcc.replace(/[^a-z0-9 ]/g, '');
    return cleaned;
  }

  // util para busca: normalize e remove caracteres especiais (mantém espaços para busca por substring)
  function normalizeForSearch(str = '') {
    const s = String(str || '').trim().toLowerCase();
    const noAcc = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleaned = noAcc.replace(/[^a-z0-9 ]/g, '');
    return cleaned;
  }

  // cria elemento com classe
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  // badge de área (matemática/física)
  function badgeSubject(s){
    if(!s) return '';
    if(s === 'fisica') return 'Física';
    if(s === 'matematica') return 'Matemática';
    return s;
  }

  // mostra status pequeno
  function showStatus(msg, timeout=3500) {
    let el = document.getElementById('home-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'home-status';
      el.style.position = 'fixed';
      el.style.right = '12px';
      el.style.bottom = '12px';
      el.style.padding = '8px 12px';
      el.style.background = 'rgba(0,0,0,0.7)';
      el.style.color = '#fff';
      el.style.borderRadius = '6px';
      el.style.fontSize = '13px';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    if (timeout) setTimeout(()=> { if (el.textContent === msg) el.textContent = ''; }, timeout);
  }

  // salva override no sessionStorage (array completo de profissões)
  function saveOverride(profs) {
    try {
      sessionStorage.setItem(HOME_OVERRIDE_KEY, JSON.stringify(profs));
    } catch (err) {
      console.warn('Não foi possível salvar override:', err);
    }
  }

  // lê override (se existir)
  function readOverride() {
    try {
      const raw = sessionStorage.getItem(HOME_OVERRIDE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Erro ao ler override:', err);
      return null;
    }
  }

  // --- Função para salvar JSON usando File System Access API (ou fallback download) ---
  async function saveJsonToFileSystem(profs) {
    const jsonStr = JSON.stringify(profs, null, 2);
    // 1) Tentar abrir o arquivo existente (substituir)
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json', 'application/json'] }
          }]
        });
        // opcional: checar nome sugerido se quiser forçar data.json
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        return { ok: true, method: 'openPicker' };
      } catch (err) {
        console.warn('showOpenFilePicker falhou/cancelado:', err);
      }
    }

    // 2) Tentar showSaveFilePicker (criar/selecionar local para salvar)
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'data.json',
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        return { ok: true, method: 'savePicker' };
      } catch (err) {
        console.warn('showSaveFilePicker falhou/cancelado:', err);
      }
    }

    // 3) Fallback: download automático
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.updated.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return { ok: true, method: 'download' };
    } catch (err) {
      console.error('Erro no fallback de download:', err);
      return { ok: false, error: err };
    }
  }

  // monta um card para uma profissão p (obj do JSON) sem botão de excluir
  function cardProfession(p, profs) {
    const id = esc(p.id || '');
    const name = esc(p.name || id || '—');
    const image = esc(p.image || '🏷️');

    const materials = p.materials || {};
    // conta materiais por área
    const counts = [];
    Object.keys(materials).forEach(subj => {
      const n = Object.keys(materials[subj] || {}).length;
      counts.push(`${badgeSubject(subj)}: ${n}`);
    });

    const card = el('article','card');
    const thumb = el('div','card__thumb');
    thumb.innerHTML = `<span style="font-size:38px">${image}</span><span class="badge">${safeText(id)}</span>`;

    const body = el('div','card__body');
    body.innerHTML = `
      <h3 class="card__title">${safeText(name)}</h3>
      <div class="card__meta">${counts.length ? safeText(counts.join(' • ')) : 'Sem materiais'}</div>
    `;

    const actions = el('div','card__actions');
    const left = el('div');

    const aOpen = document.createElement('a');
    aOpen.className = 'btn btn--primary';
    aOpen.textContent = 'Entrar';
    aOpen.href = `/contents.html?id=${encodeURIComponent(id)}`;

    left.appendChild(aOpen);
    actions.appendChild(left);

    // NOTE: botão Excluir removido conforme pedido

    card.appendChild(thumb);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  }

  // Ordena profissões alfabeticamente pelo 'name' (tratamento de acentos e caixa)
  function sortProfessionsAlpha(profs) {
    if (!Array.isArray(profs)) return profs;
    const arr = profs.slice();
    arr.sort((a, b) => {
      const an = normalizeForSort(a && a.name ? a.name : (a && a.id ? a.id : ''));
      const bn = normalizeForSort(b && b.name ? b.name : (b && b.id ? b.id : ''));
      return an.localeCompare(bn, 'pt', { sensitivity: 'base', numeric: true });
    });
    return arr;
  }

  // renderiza a home completa (sem o card de criar), agora com busca
  function renderHome(profs){
    const root = document.querySelector(ROOT_SEL) || document.body;
    // limpa
    root.innerHTML = '';

    // hero
    const heroWrap = el('section','section');
    const hero = el('div','hero card');
    hero.style.padding = '18px';
    hero.innerHTML = `
      <div class="card__body">
          <h2 style="margin:.2rem 0 0;">Bem-vindo 👋</h2>
          <p class="card__desc">Estude Matemática e Física em como as profissões a usam. Progrida no seu ritmo e sempre constante.</p>
      </div>
    `;
    heroWrap.appendChild(hero);
    root.appendChild(heroWrap);

    // grid section
    const sec = el('section','section');
    const head = el('div','section__head'); head.innerHTML = `<h2 style="margin:0">Profissões</h2>`;
    sec.appendChild(head);

    // === Adiciona input de busca logo abaixo do título "Profissões" ===
    const searchWrap = el('div','search-wrap');
    searchWrap.style.margin = '12px 0';
    searchWrap.innerHTML = `
      <input id="prof-search" type="search" placeholder="Buscar profissões (parte do nome ou id)" style="padding:8px; width:60%; max-width:400px;">
      <button id="prof-search-clear" class="btn" type="button" style="margin-left:8px;">Limpar</button>
      <div style="margin-top:6px;font-size:13px;color:#666">A busca ignora acentos e não diferencia maiúsculas/minúsculas.</div>
    `;
    sec.appendChild(searchWrap);

    const grid = el('div','grid');
    sec.appendChild(grid);
    root.appendChild(sec);

    // ordenar antes de renderizar
    const sorted = sortProfessionsAlpha(profs || []);

    // função que renderiza o conteúdo do grid de acordo com um termo de busca ('' => tudo)
    function renderGridWithFilter(queryNormalized) {
      grid.innerHTML = '';

      const toShow = (queryNormalized && queryNormalized.length)
        ? sorted.filter(p => {
            const nameNorm = normalizeForSearch(p && p.name ? p.name : '');
            const idNorm = normalizeForSearch(p && p.id ? p.id : '');
            return nameNorm.indexOf(queryNormalized) !== -1 || idNorm.indexOf(queryNormalized) !== -1;
          })
        : sorted;

      toShow.forEach(p => {
        try {
          grid.appendChild(cardProfession(p, sorted));
        } catch (err) {
          console.warn('Erro ao gerar card para', p, err);
        }
      });

      if (toShow.length === 0) {
        const msg = el('div','no-results');
        msg.style.padding = '12px';
        msg.style.color = '#666';
        msg.textContent = 'Nenhuma profissão encontrada com esse termo.';
        grid.appendChild(msg);
      }
    }

    // hooks do input
    const inputSearch = document.getElementById('prof-search');
    const btnClear = document.getElementById('prof-search-clear');

    // render inicial (sem filtro)
    renderGridWithFilter('');

    // listener de input - busca dinâmica
    inputSearch.addEventListener('input', (ev) => {
      const q = String(ev.target.value || '').trim();
      const qNorm = normalizeForSearch(q);
      renderGridWithFilter(qNorm);
    });

    // limpar busca
    btnClear.addEventListener('click', () => {
      inputSearch.value = '';
      inputSearch.focus();
      renderGridWithFilter('');
    });

    // permitir buscar com Enter no input (mesma ação do input)
    inputSearch.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const qNorm = normalizeForSearch(inputSearch.value || '');
        renderGridWithFilter(qNorm);
      }
    });
  }

  // load JSON e render
  async function boot(){
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Erro ao carregar JSON: ' + res.status);
      let data = await res.json();
      // espera um array no topo
      if (!Array.isArray(data)) {
        console.error('Formato inesperado: JSON esperado ser um array de profissões.');
        renderHome([]);
        return;
      }

      // se houver override em sessionStorage, use-o (mantém alterações da Home)
      const override = readOverride();
      if (override && Array.isArray(override)) {
        data = override;
      }

      renderHome(data);
    } catch (err) {
      console.error(err);
      // fallback: render vazio com mensagem
      const root = document.querySelector(ROOT_SEL) || document.body;
      root.innerHTML = '<section class="section"><div class="card"><div class="card__body"><h2>Profissões</h2><p>Erro ao carregar dados. Veja console.</p></div></div></section>';
    }
  }

  // start
  document.addEventListener('DOMContentLoaded', boot);
})();
