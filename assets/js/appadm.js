(() => {
  const DATA_URL = 'assets/json/data.json';
  const ROOT_SEL = '#app'; // container onde os cards vão aparecer

  // keys sessionStorage
  const NEW_PROF_KEY = 'sepi_new_profession_v1';
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
        // usuário cancelou ou ocorreu erro: continuar para tentar showSaveFilePicker
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

  // monta um card "Criar nova profissão" — com input inline
  function cardCreate(profs) {
    const card = el('article','card card--create');
    const thumb = el('div','card__thumb');
    thumb.innerHTML = `<span style="font-size:38px">＋</span><span class="badge">Novo</span>`;
    const body = el('div','card__body');
    body.innerHTML = `
      <h3 class="card__title">Criar nova profissão</h3>
      <p class="card__desc">Adicione uma nova profissão e seus materiais.</p>
      <div class="card__meta">Gerencie profissões</div>
    `;

    const form = el('div','card__create-form');
    form.style.marginTop = '10px';
    form.innerHTML = `
      <input type="text" class="create-name" placeholder="Nome da profissão (ex: Fisioterapia)" style="padding:6px;width:60%;">
      <button class="btn-create btn btn--primary" type="button" style="margin-left:8px">Criar</button>
      <div class="create-msg" style="color:#a00;margin-top:6px;font-size:13px;"></div>
    `;

    const input = form.querySelector('.create-name');
    const btn = form.querySelector('.btn-create');
    const msg = form.querySelector('.create-msg');

    // valida e cria
    btn.addEventListener('click', () => {
      msg.textContent = '';
      const nome = String(input.value || '').trim();
      if (!nome) {
        msg.textContent = 'Informe um nome válido.';
        return;
      }
      const id = makeIdFromName(nome);
      if (!id) {
        msg.textContent = 'Nome inválido para gerar ID (use letras/números).';
        return;
      }

      // checar duplicata considerando override também
      const override = readOverride();
      const all = (override && Array.isArray(override)) ? override : profs || [];
      const exists = all.some(p => String(p.id) === id);
      if (exists) {
        msg.textContent = `Já existe a profissão com id "${id}".`;
        return;
      }

      // criar objeto mínimo e salvar em sessionStorage para o CRUD ler
      const newProf = {
        id: id,
        name: nome,
        image: "",
        materials: {}
      };
      try {
        sessionStorage.setItem(NEW_PROF_KEY, JSON.stringify(newProf));
      } catch (err) {
        console.warn('Não foi possível usar sessionStorage:', err);
      }

      // também atualiza a lista local (override) para refletir imediatamente na home
      const newList = all.slice();
      newList.push(newProf);
      saveOverride(newList);

      // redireciona ao CRUD
      location.href = `/systemadm.html?id=${encodeURIComponent(id)}`;
    });

    // Enter no input cria
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') btn.click();
    });

    card.appendChild(thumb);
    card.appendChild(body);
    card.appendChild(form);
    return card;
  }

  // monta um card para uma profissão p (obj do JSON) com botão de excluir
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
      <p class="card__desc">ID: ${safeText(id)}</p>
      <div class="card__meta">${counts.length ? safeText(counts.join(' • ')) : 'Sem materiais'}</div>
    `;

    const actions = el('div','card__actions');
    const left = el('div');

    const aOpen = document.createElement('a');
    aOpen.className = 'btn btn--primary';
    aOpen.textContent = 'Abrir / Editar';
    aOpen.href = `/systemadm.html?id=${encodeURIComponent(id)}`;

    left.appendChild(aOpen);
    actions.appendChild(left);

    // botão excluir (à direita)
    const right = el('div');
    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn--danger';
    btnDel.textContent = 'Excluir';
    btnDel.type = 'button';
    btnDel.style.marginLeft = '8px';
    right.appendChild(btnDel);
    actions.appendChild(right);

    // excluir lógica: atualiza lista e solicita salvar no disco
    btnDel.addEventListener('click', async () => {
      if (!confirm(`Excluir a profissão "${p.name || p.id}"? Esta ação removerá a profissão do arquivo JSON se você confirmar no explorador.`)) return;

      // obter lista atual (do override se existir, senão do profs recebido)
      const override = readOverride();
      const all = (override && Array.isArray(override)) ? override.slice() : (profs || []).slice();

      const idx = all.findIndex(x => String(x.id) === String(p.id));
      if (idx === -1) {
        alert('Profissão não encontrada na lista local. Operação cancelada.');
        return;
      }

      // remover localmente
      all.splice(idx, 1);

      // primeiro atualiza override local para refletir mudança imediatamente (UI)
      saveOverride(all);
      renderHome(all);

      showStatus('Tentando salvar alteração no arquivo (abra o explorador)...');

      // tenta salvar no disk (explorer) - se ok, limpa overrides e recarrega; se usuário cancelar ou falhar, faz download como fallback
      try {
        const result = await saveJsonToFileSystem(all);
        if (result && result.ok) {
          // sucesso: limpar sessionStorage e recarregar a home para ler do arquivo salvo (se disponível)
          try { sessionStorage.removeItem(HOME_OVERRIDE_KEY); } catch(e){}
          try { sessionStorage.removeItem(NEW_PROF_KEY); } catch(e){}
          alert('Arquivo atualizado com sucesso (' + (result.method || 'unknown') + '). A página será recarregada.');
          location.reload();
          return;
        } else {
          // falha
          alert('Não foi possível salvar direto no disco; foi iniciado o download como fallback.');
          // já foi feito fallback de download dentro da função
        }
      } catch (err) {
        console.error('Erro ao salvar arquivo:', err);
        alert('Erro ao salvar o arquivo. Veja console.');
      }
    });

    card.appendChild(thumb);
    card.appendChild(body);
    card.appendChild(actions);

    return card;
  }

  // renderiza a home completa
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
        <h2 style="margin:.2rem 0 0;">Painel de Profissões</h2>
        <p class="card__desc">Clique em um card para editar no painel administrativo.</p>
      </div>
    `;
    heroWrap.appendChild(hero);
    root.appendChild(heroWrap);

    // grid
    const sec = el('section','section');
    const head = el('div','section__head'); head.innerHTML = `<h2 style="margin:0">Profissões</h2>`;
    sec.appendChild(head);

    const grid = el('div','grid');
    // primeiro: criar (recebe lista para checagem de duplicatas)
    grid.appendChild(cardCreate(profs));

    // depois: cada profissão
    (profs || []).forEach(p => {
      try {
        grid.appendChild(cardProfession(p, profs));
      } catch (err) {
        console.warn('Erro ao gerar card para', p, err);
      }
    });

    sec.appendChild(grid);
    root.appendChild(sec);
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
