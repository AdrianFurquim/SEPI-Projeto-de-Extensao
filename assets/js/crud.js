(() => {
  const DATA_URL = 'assets/json/data.json';

  let contents = [];
  const params = new URLSearchParams(location.search);
  const currentCourseId = params.get('id'); // exemplo: ?id=fisioterapia

  // chave usada na home para criar nova profissão
  const NEW_PROF_KEY = 'sepi_new_profession_v1';

  // DOM
  const lessonsList = document.querySelector('.lessons-list');
  const lessonsListFisica = document.querySelector('.lessons-list-fisica');
  const leftContent = document.querySelector('.left-content');
  const rightContent = document.querySelector('.right-content');
  const titleMaterialEl = document.querySelector('.title-matetial');
  const bannerTitle = document.querySelector('.couse-banner-title');
  const salvarBtn = document.querySelector('.next-activity-btn');

  // util
  const uid = (p='') => p + Math.random().toString(36).slice(2,10);
  const escapeHtml = s => s==null ? '' : String(s)
    .replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
    .replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function showStatus(msg, timeout=3500) {
    let el = document.getElementById('crud-status');
    if (!el) {
      el = document.createElement('div');
      el.id = 'crud-status';
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

  // normaliza o nome da matéria para idMat: remove acentos, remove não alfanuméricos, converte para lowercase
  function normalizeMatIdFromName(name='') {
    if (!name) return '';
    const s = String(name).trim();
    const noAcc = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const onlyAlnum = noAcc.replace(/[^A-Za-z0-9]/g, '');
    return onlyAlnum.toLowerCase();
  }

  // tenta renomear a chave do material dentro do course.materials[areaKey]
  function tryRenameMaterialKey(course, areaKey, oldId, newId, mat) {
    if (!newId) return oldId || '';
    // se não havia oldId mas a chave existente é baseada em outra coisa, tentaremos descobrir:
    if (!oldId) {
      // procurar key que referencia exatamente o objeto `mat`
      const area = (course.materials && course.materials[areaKey]) || {};
      for (const k of Object.keys(area)) {
        if (area[k] === mat) { oldId = k; break; }
      }
    }
    if (!oldId) {
      // não havia chave conhecida — tentamos só inserir com newId
      if (!course.materials) course.materials = {};
      if (!course.materials[areaKey]) course.materials[areaKey] = {};
      // se já existir newId -> conflito
      if (course.materials[areaKey][newId]) {
        showStatus(`Já existe material com id "${newId}". Renomeação não realizada.`);
        return oldId || '';
      }
      course.materials[areaKey][newId] = mat;
      try { mat.idMat = newId; } catch(e){}
      // atualizar dataset
      document.querySelectorAll('.lesson-item').forEach(item => {
        if (item.dataset && (item.dataset.id === oldId || !item.dataset.id)) item.dataset.id = newId;
      });
      return newId;
    }

    if (oldId === newId) return newId;
    if (!course.materials) course.materials = {};
    if (!course.materials[areaKey]) course.materials[areaKey] = {};
    // se já existir chave com newId -> conflito
    if (course.materials[areaKey][newId]) {
      showStatus(`Já existe material com id "${newId}". Renomeação não realizada.`);
      return oldId;
    }
    // renomear: atribuir e deletar antigo
    course.materials[areaKey][newId] = mat;
    try { delete course.materials[areaKey][oldId]; } catch(e){}
    try { mat.idMat = newId; } catch(e){}
    // atualizar dataset nos elementos da lista para manter seleção visual
    document.querySelectorAll('.lesson-item').forEach(item => {
      if (item.dataset && item.dataset.id === oldId) item.dataset.id = newId;
    });
    return newId;
  }

  // Load JSON
  async function load() {
    try {
      const res = await fetch(DATA_URL, { cache:'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar JSON: ' + res.status);
      contents = await res.json();

      // --- Normalizar: garantir que cada material tenha idMat (usa a chave caso falte)
      contents.forEach(course => {
        if (!course || !course.materials) return;
        Object.keys(course.materials).forEach(areaKey => {
          Object.keys(course.materials[areaKey]).forEach(matKey => {
            const m = course.materials[areaKey][matKey];
            if (m && !m.idMat) m.idMat = matKey;
          });
        });
      });

      // --- novo: se a URL pede um id que não existe, verifique sessionStorage para nova profissão ---
      if (currentCourseId) {
        const course = contents.find(c => String(c.id) === String(currentCourseId));
        if (!course) {
          try {
            const maybe = sessionStorage.getItem(NEW_PROF_KEY);
            if (maybe) {
              const newProf = JSON.parse(maybe);
              // se o sessionStorage conter um objeto com id que bate com o id da URL, injeta no contents
              if (newProf && newProf.id && String(newProf.id) === String(currentCourseId)) {
                // previne duplicata por segurança
                const already = contents.find(c => String(c.id) === String(newProf.id));
                if (!already) {
                  contents.push(newProf);
                  showStatus(`Nova profissão "${newProf.name}" criada e aberta para edição.`);
                } else {
                  showStatus('Profissão já existe no JSON. Abrindo existente.');
                }
                // remover chave para não recriar na próxima carga
                try { sessionStorage.removeItem(NEW_PROF_KEY); } catch(e) {}
              }
            }
          } catch (err) {
            console.warn('Erro ao ler newProfession da sessionStorage', err);
          }
        }
      }

      // aplicar override vindo da Home (opcional)
      try {
        const homeOverrideRaw = sessionStorage.getItem('sepi_home_override_v1');
        if (homeOverrideRaw) {
          const overrideArr = JSON.parse(homeOverrideRaw);
          if (Array.isArray(overrideArr)) {
            contents = overrideArr;
            console.log('Aplicado override vindo da Home (sessionStorage).');
            // garantir idMat também para override
            contents.forEach(course => {
              if (!course || !course.materials) return;
              Object.keys(course.materials).forEach(areaKey => {
                Object.keys(course.materials[areaKey]).forEach(matKey => {
                  const m = course.materials[areaKey][matKey];
                  if (m && !m.idMat) m.idMat = matKey;
                });
              });
            });
          }
        }
      } catch(err) {
        console.warn('Erro aplicando override da Home:', err);
      }

      renderAll();
    } catch (err) {
      console.error(err);
      showStatus('Erro ao carregar JSON (veja console).');
    }
  }

  // Render geral
  function renderAll() {
    if (!currentCourseId) {
      showStatus('Parâmetro ?id= faltando na URL (ex: ?id=fisioterapia).');
      return;
    }
    const course = contents.find(c => String(c.id) === String(currentCourseId));
    if (!course) {
      showStatus('Curso não encontrado no JSON.');
      return;
    }

    // título matéria (input)
    if (titleMaterialEl) {
      titleMaterialEl.innerHTML = `<input type="text" class="title-material-input" value="${escapeHtml(course.name)}">`;
      titleMaterialEl.querySelector('.title-material-input')
        .addEventListener('input', e => { course.name = e.target.value; });
    }

    // limpa listas
    if (lessonsList) lessonsList.innerHTML = '';
    if (lessonsListFisica) lessonsListFisica.innerHTML = '';

    // renderiza listas
    renderLessonsList(course, 'matematica', lessonsList);
    renderLessonsList(course, 'fisica', lessonsListFisica);

    // limpa conteúdos
    if (leftContent) leftContent.innerHTML = '';
    if (rightContent) rightContent.innerHTML = '';
  }

  function renderLessonsList(course, areaKey, container) {
    if (!container) return;
    const materias = course?.materials?.[areaKey] || {};
    const frag = document.createDocumentFragment();

    Object.keys(materias).forEach(k => {
      const mat = materias[k];
      const item = document.createElement('div');
      item.className = 'lesson-item';
      // dataset id = preferencialmente mat.idMat, se não existir utiliza a chave k
      const useId = mat && mat.idMat ? mat.idMat : k;
      item.dataset.id = useId;
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '6px 4px';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      // mostrar o nome como salvo (mantém pontuação e maiúsculas)
      left.innerHTML = `<span class="lesson-name" style="cursor:pointer">${escapeHtml(mat.name || mat.idMat || k)}</span>`;

      const actions = document.createElement('div');
      actions.style.display='flex';
      actions.style.gap='6px';
      actions.innerHTML = `
        <button class="btn-edit" data-id="${escapeHtml(useId)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
          </svg>
        </button>
        <button class="btn-delete" data-id="${escapeHtml(useId)}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
          </svg>
        </button>
      `;

      item.appendChild(left);
      item.appendChild(actions);

      // click no nome abre editor (passando matKey = k)
      item.querySelector('.lesson-name').addEventListener('click', () => {
        // marca visual
        container.querySelectorAll('.lesson-item').forEach(i=>i.classList.remove('active'));
        item.classList.add('active');
        renderLessonEditor(course, areaKey, mat, k);
      });

      // editar botão (passando matKey)
      item.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        renderLessonEditor(course, areaKey, mat, k);
      });

      // excluir -- usa mat.idMat || k
      item.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!confirm(`Excluir "${mat.name}"?`)) return;
        const keyToDelete = (mat && mat.idMat) ? mat.idMat : k;
        try { delete course.materials[areaKey][keyToDelete]; } catch(e){}
        renderAll();
        showStatus('Aula excluída.');
      });

      frag.appendChild(item);
    });

    container.appendChild(frag);

    // botão novo (gera id a partir do nome padrão e garante unicidade)
    const addBtn = document.createElement('button');
    addBtn.textContent = areaKey === 'matematica' ? '+ Novo (Matemática)' : '+ Novo (Física)';
    addBtn.className = "btn-add-mat"
    addBtn.style.marginTop = '8px';
    addBtn.addEventListener('click', () => {
      if (!course.materials) course.materials = {};
      if (!course.materials[areaKey]) course.materials[areaKey] = {};
      const defaultName = 'Novo material';
      let baseId = normalizeMatIdFromName(defaultName) || ('mat' + uid('').toLowerCase());
      let newId = baseId;
      let suffix = 1;
      // garantir unicidade
      while (course.materials[areaKey][newId]) {
        newId = `${baseId}_${suffix}`;
        suffix++;
      }
      course.materials[areaKey][newId] = {
        idMat: newId,
        name: defaultName, // mantém pontuação e capitalização padrão
        videos: [],
        textos: []
      };
      renderAll();
      showStatus('Novo material criado.');
    });
    container.appendChild(addBtn);
  }

  // Editor de aula (leftContent e rightContent)
  // agora recebe matKey (a chave original no objeto materials)
  function renderLessonEditor(course, areaKey, mat, matKey) {
    if (!leftContent || !rightContent) return;
    leftContent.innerHTML = '';
    rightContent.innerHTML = '';

    // atualiza banner
    if (bannerTitle) {
      bannerTitle.innerHTML = `<input type="text" class="banner-material-input" value="${escapeHtml(mat.name||'')}">`;
      const bannerInput = bannerTitle.querySelector('.banner-material-input');
      // enquanto digita, atualiza nome (visualmente)
      bannerInput.addEventListener('input', e => {
        mat.name = e.target.value; // mantém como o usuário digitar
        updateListLabels(mat.idMat || matKey, mat.name);
      });
      // ao sair do input (blur) tenta renomear o idMat conforme regra
      bannerInput.addEventListener('blur', () => {
        const newId = normalizeMatIdFromName(mat.name);
        const oldId = (mat && mat.idMat) ? mat.idMat : (matKey || '');
        const finalId = tryRenameMaterialKey(course, areaKey, oldId, newId, mat);
        // se renomeou, atualizar label
        updateListLabels(finalId, mat.name);
      });
    }

    // Header
    const header = document.createElement('div');
    header.style.display='flex';
    header.style.alignItems='center';
    header.style.gap='8px';
    header.innerHTML = `
      <label style="display: none;">Título: <input type="text" class="mat-name-input" value="${escapeHtml(mat.name||'')}"></label>
      <button class="btn-add-text">+ Texto</button>
      <button class="btn-add-video">+ Vídeo</button>
      <button class="btn-dup">Duplicar</button>
      <button class="btn-del">Excluir Aula</button>
    `;
    leftContent.appendChild(header);

    const matNameInput = header.querySelector('.mat-name-input');

    // enquanto digita atualiza nome (visualmente)
    matNameInput.addEventListener('input', e => {
      mat.name = e.target.value; // mantém input do usuário
      updateListLabels(mat.idMat || matKey, mat.name);
    });

    // ao sair do input (blur) tenta renomear o idMat conforme regra
    matNameInput.addEventListener('blur', () => {
      const newId = normalizeMatIdFromName(mat.name);
      const oldId = (mat && mat.idMat) ? mat.idMat : (matKey || '');
      const finalId = tryRenameMaterialKey(course, areaKey, oldId, newId, mat);
      updateListLabels(finalId, mat.name);
    });

    header.querySelector('.btn-add-text').addEventListener('click', () => {
      mat.textos = mat.textos || [];
      mat.textos.push('Novo Título|||Novo conteúdo...');
      renderLessonEditor(course, areaKey, mat, matKey);
    });
    header.querySelector('.btn-add-video').addEventListener('click', () => {
      mat.videos = mat.videos || [];
      mat.videos.push(' ||| ');
      renderLessonEditor(course, areaKey, mat, matKey);
    });
    header.querySelector('.btn-dup').addEventListener('click', () => {
      // duplicar: gerar id a partir do nome do clone (normalizado) e garantir unicidade
      const clone = JSON.parse(JSON.stringify(mat));
      const baseId = normalizeMatIdFromName(clone.name) || ('mat' + uid('').toLowerCase());
      let nid = baseId;
      let i = 1;
      if (!course.materials) course.materials = {};
      if (!course.materials[areaKey]) course.materials[areaKey] = {};
      while (course.materials[areaKey][nid]) {
        nid = `${baseId}_${i}`; i++;
      }
      clone.idMat = nid;
      course.materials[areaKey][nid] = clone;
      renderAll();
      showStatus('Aula duplicada.');
    });
    header.querySelector('.btn-del').addEventListener('click', () => {
      if (!confirm(`Excluir aula "${mat.name}"?`)) return;
      const keyToDelete = (mat && mat.idMat) ? mat.idMat : matKey;
      try { delete course.materials[areaKey][keyToDelete]; } catch(e){}
      leftContent.innerHTML = '';
      rightContent.innerHTML = '';
      renderAll();
      showStatus('Aula excluída.');
    });

    // Textos (left)
    const textosWrap = document.createElement('div');
    textosWrap.innerHTML = `<h3>Textos</h3>`;
    leftContent.appendChild(textosWrap);

    (mat.textos || []).forEach((raw, idx) => {
      let title = '';
      let content = raw;
      if (typeof raw === 'string' && raw.includes('|||')) {
        const parts = raw.split('|||');
        title = parts[0].trim();
        content = parts.slice(1).join('|||').trim();
      }
      const block = document.createElement('div');
      block.style.border = '1px solid #e6e6e6';
      block.style.padding = '8px';
      block.style.marginBottom = '8px';
      block.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <label>Título: <input class="texto-titulo" value="${escapeHtml(title)}"></label>
          <button class="rm-texto">Remover</button>
        </div>
        <div style="margin-top:8px;">
          <textarea class="texto-conteudo" rows="6" style="width:100%;">${escapeHtml(content)}</textarea>
        </div>
        <div style="font-size:12px;color:#444;margin-top:6px;">
          Salve a imagem em assets/img/name, e use [[[assets/img/name.jpg~~~Fonte]]] para inserir imagens no conteúdo.
        </div>
      `;
      // remover
      block.querySelector('.rm-texto').addEventListener('click', () => {
        if (!confirm('Remover este bloco de texto?')) return;
        mat.textos.splice(idx,1);
        renderLessonEditor(course, areaKey, mat, matKey);
      });

      // atualizações
      const tInput = block.querySelector('.texto-titulo');
      const cArea = block.querySelector('.texto-conteudo');
      tInput.addEventListener('input', () => {
        mat.textos[idx] = `${tInput.value}|||${cArea.value}`;
      });
      cArea.addEventListener('input', () => {
        mat.textos[idx] = `${tInput.value}|||${cArea.value}`;
      });

      textosWrap.appendChild(block);
    });

    // Vídeos (right)
    const vidsWrap = document.createElement('div');
    vidsWrap.innerHTML = `<h3>Vídeos</h3>`;
    rightContent.appendChild(vidsWrap);

    (mat.videos || []).forEach((raw, idx) => {
      let autor = '';
      let url = raw || '';
      if (typeof raw === 'string' && raw.includes('|||')) {
        const p = raw.split('|||');
        autor = p[0].trim();
        url = p.slice(1).join('|||').trim();
      }
      const vblock = document.createElement('div');
      vblock.style.border = '1px solid #eee';
      vblock.style.padding = '8px';
      vblock.style.marginBottom = '8px';
      vblock.innerHTML = `
        <div class="video-header">
          <label>Autor: <input class="video-autor" value="${escapeHtml(autor)}" placeholder="Autor"></label>
          <button class="rm-video">Remover</button>
        </div>
        <div style="margin-top:6px;">
          <label>URL: <input class="video-url" value="${escapeHtml(url)}" style="width:90%" placeholder="https://"></label>
        </div>
      `;
      vblock.querySelector('.rm-video').addEventListener('click', () => {
        if (!confirm('Remover este vídeo?')) return;
        mat.videos.splice(idx,1);
        renderLessonEditor(course, areaKey, mat, matKey);
      });

      const autorInput = vblock.querySelector('.video-autor');
      const urlInput = vblock.querySelector('.video-url');
      autorInput.addEventListener('input', () => {
        const a = autorInput.value;
        const u = urlInput.value;
        mat.videos[idx] = a ? `${a}|||${u}` : u;
      });
      urlInput.addEventListener('input', () => {
        const a = autorInput.value;
        const u = urlInput.value;
        mat.videos[idx] = a ? `${a}|||${u}` : u;
      });

      // preview se youtube
      const preview = createYouTubePreview(url);
      if (preview) vblock.appendChild(preview);

      vidsWrap.appendChild(vblock);
    });
  }

  function updateListLabels(idMat, name) {
    document.querySelectorAll('.lesson-item').forEach(item => {
      if (item.dataset.id === idMat) {
        const span = item.querySelector('.lesson-name');
        if (span) span.textContent = name || idMat;
      }
    });
  }

  // Youtube preview util
  function extractYouTubeId(url='') {
    const re = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const m = (url||'').match(re);
    return m ? m[1] : null;
  }
  function createYouTubePreview(url='') {
    const id = extractYouTubeId(url||'') ;
    if (!id) return null;
    const d = document.createElement('div');
    d.style.marginTop='8px';
    d.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" title="preview" style="width:100%;height:160px;border:0;" allowfullscreen loading="lazy"></iframe>`;
    return d;
  }

  // ----- helper: salva usando File System Access API (quando disponível) -----
  async function saveUsingFileSystem(jsonStr) {
    try {
      if (window.showSaveFilePicker) {
        const opts = {
          suggestedName: 'data.json',
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json'] }
          }]
        };
        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        showStatus('Arquivo salvo (via File System Access).');
        return true;
      }

      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON',
            accept: { 'application/json': ['.json'] }
          }],
          excludeAcceptAllOption: false,
          multiple: false
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        showStatus('Arquivo salvo (via File System Access).');
        return true;
      }

      return false;
    } catch (err) {
      console.error('saveUsingFileSystem erro:', err);
      return false;
    }
  }

  // ----- SALVAR (botão existente .next-activity-btn) -----
  async function onSaveClicked() {
    try {
      const json = JSON.stringify(contents, null, 2);

      // Tenta salvar diretamente no disco com File System API
      if (window && (window.showSaveFilePicker || window.showOpenFilePicker)) {
        const ok = await saveUsingFileSystem(json);
        if (ok) return; // salvo com sucesso
        // se falhou (ex: usuário cancelou ou erro), continua para fallback
      }

      // Fallback: download (comportamento antigo)
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.updated.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showStatus('Download iniciado: data.updated.json');
    } catch (err) {
      console.error(err);
      showStatus('Erro ao salvar (veja console).');
    }
  }

  // Hook no botão SALVAR se existir
  if (salvarBtn) {
    salvarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      onSaveClicked();
    });
  }

  // inicia
  load();

  // Exponha utilidades para debug no console
  window.CRUD_SEPI = {
    getContents: () => contents,
    saveNow: onSaveClicked,
    // manter compatibilidade: setSaveMode não é usado no fluxo atual, mas deixo a função
    setSaveMode: (m) => { showStatus('Modo de salvamento (download/File API).'); }
  };
})();
