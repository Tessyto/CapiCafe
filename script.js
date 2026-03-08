document.addEventListener('DOMContentLoaded', () => {
    const itemsContainer = document.getElementById('items-container');
    const btnAddSection = document.getElementById('btn-add-section');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const btnSaveMenu = document.getElementById('btn-save-menu');
    const btnSettings = document.getElementById('btn-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const previewList = document.getElementById('menu-preview-list');

    // Paleta de colores para secciones
    const SECTION_COLORS = [
        { bg: '#fff8f0', accent: '#b07d54', border: '#f0d9c0' },
        { bg: '#f0f7ff', accent: '#4a7fb5', border: '#c0d8f0' },
        { bg: '#f0fff4', accent: '#2d8a5e', border: '#b0e0c8' },
        { bg: '#fdf0ff', accent: '#8a4ab5', border: '#d8b0f0' },
        { bg: '#fff0f0', accent: '#b54a4a', border: '#f0b0b0' },
        { bg: '#fffff0', accent: '#8a8a2d', border: '#e0e0a0' },
    ];

    let sectionIdCounter = 0;
    let itemIdCounter = 0;
    let sectionColorIndex = 0;

    // --- GLOBALES ---

    window.actualizarTitulo = function() {
        const titulo = document.getElementById('input-menu-title').value || 'Nuestro Menú';
        const subtitulo = document.getElementById('input-menu-subtitle').value;
        document.getElementById('preview-title').textContent = titulo;
        const subEl = document.getElementById('preview-subtitle');
        subEl.textContent = subtitulo;
        subEl.style.display = subtitulo ? 'block' : 'none';
    };

    window.eliminarSeccion = function(secId) {
        const sec = document.getElementById(`section-${secId}`);
        if (sec) { sec.remove(); window.actualizarPreview(); }
    };

    window.toggleSeccion = function(secId) {
        const sec = document.getElementById(`section-${secId}`);
        const arrow = sec.querySelector('.section-arrow');
        const isCollapsed = sec.classList.toggle('collapsed');
        arrow.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
    };

    window.eliminarItem = function(itemId) {
        const formDiv = document.getElementById(`form-${itemId}`);
        if (formDiv) { formDiv.remove(); window.actualizarPreview(); }
    };

    window.agregarItemASeccion = function(secId) {
        const container = document.querySelector(`#section-${secId} .section-items`);
        container.appendChild(crearFormularioItem(null, secId));
        window.actualizarPreview();
    };

    window.actualizarPreview = function() {
        const datos = recolectarDatos();
        renderizarPreview(datos);
        guardarEnStorage();
    };

    // Toggle modo imagen: URL vs subida de archivo
    window.toggleImageMode = function(itemId) {
        const form = document.getElementById(`form-${itemId}`);
        const urlGroup = form.querySelector('.img-url-group');
        const uploadGroup = form.querySelector('.img-upload-group');
        const isUrl = urlGroup.style.display !== 'none';
        urlGroup.style.display = isUrl ? 'none' : 'block';
        uploadGroup.style.display = isUrl ? 'block' : 'none';
        form.querySelector('.btn-toggle-img').textContent = isUrl ? '🔗 Usar URL' : '📁 Subir archivo';
    };

    window.handleImageUpload = function(itemId, input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const form = document.getElementById(`form-${itemId}`);
            form.querySelector('.input-imagen-b64').value = e.target.result;
            form.querySelector('.img-upload-preview').src = e.target.result;
            form.querySelector('.img-upload-preview').style.display = 'block';
            window.actualizarPreview();
        };
        reader.readAsDataURL(file);
    };

    // --- LÓGICA INTERNA ---

    function obtenerImagenItem(form) {
        const urlGroup = form.querySelector('.img-url-group');
        if (urlGroup && urlGroup.style.display !== 'none') {
            return { tipo: 'url', valor: form.querySelector('.input-imagen-url').value.trim() };
        }
        return { tipo: 'b64', valor: form.querySelector('.input-imagen-b64').value.trim() };
    }

    function crearFormularioItem(datosPrevios = null, secId = null) {
        const id = itemIdCounter++;
        const formDiv = document.createElement('div');
        formDiv.className = 'item-form';
        formDiv.id = `form-${id}`;
        formDiv.dataset.sectionId = secId;

        const imgUrl = datosPrevios?.imagen_url || '';
        const imgB64 = datosPrevios?.imagen_b64 || '';
        const startInUrl = !imgB64; 

        formDiv.innerHTML = `
            <div class="item-form-header">
                <span class="item-num">Producto</span>
                <button type="button" class="btn-remove" onclick="eliminarItem(${id})">✕ Eliminar</button>
            </div>
            <div class="form-group">
                <label>Nombre del Producto *</label>
                <input type="text" class="input-nombre" value="${datosPrevios?.nombre || ''}" placeholder="Ej. Espresso" oninput="actualizarPreview()">
            </div>
            <div class="form-group">
                <label>Descripción</label>
                <textarea class="input-desc" rows="2" placeholder="Descripción del producto..." oninput="actualizarPreview()">${datosPrevios?.descripcion || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Precio</label>
                    <input type="text" class="input-precio" value="${datosPrevios?.precio || ''}" placeholder="3.50" oninput="actualizarPreview()">
                </div>
                <div class="form-group">
                    <label>Tiempo (min)</label>
                    <input type="text" class="input-tiempo" value="${datosPrevios?.tiempo || ''}" placeholder="5" oninput="actualizarPreview()">
                </div>
            </div>
            <div class="form-group">
                <label>Ingredientes</label>
                <input type="text" class="input-ingredientes" value="${datosPrevios?.ingredientes || ''}" placeholder="Ej. leche, café, canela" oninput="actualizarPreview()">
            </div>
            <div class="form-group imagen-group">
                <div class="img-label-row">
                    <label>Imagen <span class="optional-tag">opcional</span></label>
                    <button type="button" class="btn-toggle-img" onclick="toggleImageMode(${id})">${startInUrl ? '📁 Subir archivo' : '🔗 Usar URL'}</button>
                </div>
                <div class="img-url-group" style="display:${startInUrl ? 'block' : 'none'}">
                    <input type="text" class="input-imagen-url" value="${imgUrl}" placeholder="https://..." oninput="actualizarPreview()">
                </div>
                <div class="img-upload-group" style="display:${startInUrl ? 'none' : 'block'}">
                    <input type="hidden" class="input-imagen-b64" value="${imgB64}">
                    <label class="upload-area">
                        <input type="file" accept="image/*" onchange="handleImageUpload(${id}, this)" style="display:none">
                        <span>📷 Haz clic para elegir imagen</span>
                        <img class="img-upload-preview" src="${imgB64}" style="display:${imgB64 ? 'block' : 'none'}">
                    </label>
                </div>
            </div>
        `;
        return formDiv;
    }

    function crearSeccion(datosPrevios = null) {
        const secId = sectionIdCounter++;
        const colorIdx = (datosPrevios?.colorIdx ?? sectionColorIndex++) % SECTION_COLORS.length;
        const color = SECTION_COLORS[colorIdx];

        const secDiv = document.createElement('div');
        secDiv.className = 'section-block';
        secDiv.id = `section-${secId}`;
        secDiv.dataset.colorIdx = colorIdx;
        secDiv.style.cssText = `--sec-bg:${color.bg};--sec-accent:${color.accent};--sec-border:${color.border};`;

        secDiv.innerHTML = `
            <div class="section-header" onclick="toggleSeccion(${secId})">
                <div class="section-title-row">
                    <span class="section-arrow">▼</span>
                    <input type="text" class="input-section-name" value="${datosPrevios?.nombre || ''}"
                        placeholder="Nombre de sección (ej. Cafés)"
                        oninput="actualizarPreview()" onclick="event.stopPropagation()">
                </div>
                <button type="button" class="btn-remove-section" onclick="event.stopPropagation(); eliminarSeccion(${secId})">✕</button>
            </div>
            <div class="section-body">
                <div class="section-items"></div>
                <button type="button" class="btn-add-item-in-section" onclick="agregarItemASeccion(${secId})">+ Agregar Producto</button>
            </div>
        `;

        const container = secDiv.querySelector('.section-items');
        if (datosPrevios?.items?.length) {
            datosPrevios.items.forEach(item => container.appendChild(crearFormularioItem(item, secId)));
        } else {
            setTimeout(() => container.appendChild(crearFormularioItem(null, secId)), 0);
        }

        itemsContainer.appendChild(secDiv);
        return secDiv;
    }

    function recolectarDatos() {
        const secciones = [];
        itemsContainer.querySelectorAll('.section-block').forEach(sec => {
            const colorIdx = parseInt(sec.dataset.colorIdx) || 0;
            const items = [];
            sec.querySelectorAll('.item-form').forEach(form => {
                const img = obtenerImagenItem(form);
                items.push({
                    nombre: form.querySelector('.input-nombre').value.trim(),
                    descripcion: form.querySelector('.input-desc').value.trim(),
                    precio: form.querySelector('.input-precio').value.trim(),
                    tiempo: form.querySelector('.input-tiempo').value.trim(),
                    ingredientes: form.querySelector('.input-ingredientes').value.trim(),
                    imagen_url: img.tipo === 'url' ? img.valor : '',
                    imagen_b64: img.tipo === 'b64' ? img.valor : '',
                });
            });
            secciones.push({
                nombre: sec.querySelector('.input-section-name').value.trim(),
                colorIdx,
                items
            });
        });
        return secciones;
    }

    function getItemImagen(item) {
        return item.imagen_b64 || item.imagen_url || '';
    }

    function renderizarPreview(secciones) {
        previewList.innerHTML = '';
        const validas = secciones.filter(s => s.nombre || s.items.some(i => i.nombre));
        if (!validas.length) {
            previewList.innerHTML = '<div class="empty-state">Agrega secciones y productos para previsualizar el menú.</div>';
            return;
        }

        validas.forEach(sec => {
            const color = SECTION_COLORS[sec.colorIdx % SECTION_COLORS.length];
            const secEl = document.createElement('div');
            secEl.className = 'preview-section';

            let html = '';
            if (sec.nombre) {
                html += `<div class="preview-section-title" style="--sec-accent:${color.accent}">
                    <span>${sec.nombre}</span>
                    <div class="preview-section-line" style="background:${color.border}"></div>
                </div>`;
            }

            sec.items.filter(i => i.nombre).forEach(item => {
                const img = getItemImagen(item);
                html += `<div class="menu-item">
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <h4 class="menu-item-name">${item.nombre}</h4>
                            ${item.precio ? `<span class="menu-item-price" style="color:${color.accent}">$${item.precio}</span>` : ''}
                        </div>
                        ${item.descripcion ? `<p class="menu-item-desc">${item.descripcion}</p>` : ''}
                        <div class="menu-item-meta">
                            ${item.tiempo ? `<span>⏱ ${item.tiempo} min</span>` : ''}
                            ${item.ingredientes ? `<span>🌿 ${item.ingredientes}</span>` : ''}
                        </div>
                    </div>
                    ${img ? `<img src="${img}" class="menu-item-img" onerror="this.style.display='none'">` : ''}
                </div>`;
            });

            secEl.innerHTML = html;
            previewList.appendChild(secEl);
        });
    }

    function guardarEnStorage() {
        const titulo = document.getElementById('input-menu-title').value;
        const subtitulo = document.getElementById('input-menu-subtitle').value;
        const template = document.querySelector('input[name="template"]:checked')?.value || 'clasico';
        const datos = recolectarDatos();
        const datosSinB64 = datos.map(sec => ({
            ...sec,
            items: sec.items.map(i => ({ ...i, imagen_b64: '' }))
        }));
        try {
            localStorage.setItem('capicafe_draft', JSON.stringify({ titulo, subtitulo, template, secciones: datosSinB64 }));
        } catch(e) { /* quota exceeded, ignorar */ }
    }

    function cargarDatosGuardados() {
        try {
            const raw = localStorage.getItem('capicafe_draft');
            if (raw) {
                const saved = JSON.parse(raw);
                if (saved.titulo) document.getElementById('input-menu-title').value = saved.titulo;
                if (saved.subtitulo) document.getElementById('input-menu-subtitle').value = saved.subtitulo;
                if (saved.template) {
                    const radio = document.querySelector(`input[name="template"][value="${saved.template}"]`);
                    if (radio) {
                        radio.checked = true;
                        actualizarTemplateUI(saved.template);
                    }
                }
                actualizarTitulo();
                if (saved.secciones?.length) {
                    saved.secciones.forEach(sec => crearSeccion(sec));
                    renderizarPreview(saved.secciones);
                    return;
                }
            }
        } catch(e) {}
        crearSeccion();
    }

    // --- GENERACIÓN PDF ---

    function getTemplate() {
        return document.querySelector('input[name="template"]:checked')?.value || 'clasico';
    }

    function generarHTMLParaPDF(secciones) {
        const titulo = document.getElementById('input-menu-title').value || 'Nuestro Menú';
        const subtitulo = document.getElementById('input-menu-subtitle').value || '';
        const template = getTemplate();

        const validas = secciones.filter(s => s.nombre || s.items.some(i => i.nombre));

        if (template === 'moderno') return pdfModerno(titulo, subtitulo, validas);
        if (template === 'minimalista') return pdfMinimalista(titulo, subtitulo, validas);
        return pdfClasico(titulo, subtitulo, validas);
    }

    function pdfClasico(titulo, subtitulo, secciones) {
        let body = '';
        secciones.forEach(sec => {
            const color = SECTION_COLORS[sec.colorIdx % SECTION_COLORS.length];
            if (sec.nombre) {
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
                    <tr><td style="text-align:center;padding-bottom:6px;">
                        <span style="font-family:Georgia,serif;font-size:13pt;color:${color.accent};text-transform:uppercase;letter-spacing:3px;font-weight:bold;">${sec.nombre}</span>
                    </td></tr>
                    <tr><td>
                        <table width="100%" cellpadding="0" cellspacing="0"><tr>
                            <td width="38%" style="border-top:1px solid ${color.border};font-size:1px;">&nbsp;</td>
                            <td width="24%"></td>
                            <td width="38%" style="border-top:1px solid ${color.border};font-size:1px;">&nbsp;</td>
                        </tr></table>
                    </td></tr>
                </table>`;
            }
            sec.items.filter(i => i.nombre).forEach(item => {
                const img = getItemImagen(item);
                const imgCell = img ? `<td width="90" style="vertical-align:top;padding-left:14px;">
                    <img src="${img}" width="78" height="78" style="border-radius:8px;object-fit:cover;display:block;" crossorigin="anonymous">
                </td>` : '';
                const meta = [item.tiempo ? `⏱ ${item.tiempo} min` : '', item.ingredientes ? `🌿 ${item.ingredientes}` : ''].filter(Boolean).join('   ');
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                    <tr>
                        <td style="vertical-align:top;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-family:Georgia,serif;font-size:12pt;font-weight:bold;color:#2c1e16;padding-bottom:4px;border-bottom:1px dotted #ddd;">${item.nombre}</td>
                                    ${item.precio ? `<td style="text-align:right;font-family:Arial,sans-serif;font-weight:bold;color:${color.accent};font-size:11pt;padding-bottom:4px;border-bottom:1px dotted #ddd;white-space:nowrap;">$${item.precio}</td>` : '<td style="border-bottom:1px dotted #ddd;"></td>'}
                                </tr>
                                ${item.descripcion ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:9pt;color:#6b5a4e;padding-top:4px;padding-bottom:3px;line-height:1.5;">${item.descripcion}</td></tr>` : ''}
                                ${meta ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:8pt;color:#8c7b6e;padding-top:2px;">${meta}</td></tr>` : ''}
                            </table>
                        </td>
                        ${imgCell}
                    </tr>
                </table>`;
            });
        });

        return `<table width="794" cellpadding="0" cellspacing="0" style="background:white;font-family:Arial,sans-serif;color:#2c1e16;width:794px;">
            <tr><td style="padding:55px 65px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr><td style="text-align:center;padding-bottom:${subtitulo ? '6px' : '12px'};">
                        <span style="font-family:Georgia,serif;font-size:26pt;color:#2c1e16;letter-spacing:4px;text-transform:uppercase;font-weight:bold;">${titulo}</span>
                    </td></tr>
                    ${subtitulo ? `<tr><td style="text-align:center;padding-bottom:12px;">
                        <span style="font-family:Arial,sans-serif;font-size:9pt;color:#b07d54;letter-spacing:2px;">${subtitulo}</span>
                    </td></tr>` : ''}
                    <tr><td style="text-align:center;"><table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td width="60" style="border-top:2px solid #b07d54;font-size:1px;">&nbsp;</td></tr></table></td></tr>
                </table>
                ${body}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;border-top:1px solid #e2d9ce;">
                    <tr><td style="text-align:center;padding-top:10px;font-family:Arial,sans-serif;font-size:8pt;color:#b07d54;">CapiCafe — Menú Artesanal</td></tr>
                </table>
            </td></tr>
        </table>`;
    }

    function pdfModerno(titulo, subtitulo, secciones) {
        let body = '';
        secciones.forEach(sec => {
            const color = SECTION_COLORS[sec.colorIdx % SECTION_COLORS.length];
            if (sec.nombre) {
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 10px;">
                    <tr><td style="background:${color.accent};padding:6px 14px;border-radius:4px;">
                        <span style="font-family:Arial,sans-serif;font-size:10pt;color:white;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">${sec.nombre}</span>
                    </td><td></td></tr>
                </table>`;
            }
            sec.items.filter(i => i.nombre).forEach(item => {
                const img = getItemImagen(item);
                const imgCell = img ? `<td width="80" style="vertical-align:top;padding-left:12px;">
                    <img src="${img}" width="72" height="72" style="border-radius:4px;object-fit:cover;display:block;" crossorigin="anonymous">
                </td>` : '';
                const meta = [item.tiempo ? `⏱ ${item.tiempo}min` : '', item.ingredientes ? `${item.ingredientes}` : ''].filter(Boolean).join(' · ');
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:#fafafa;border-left:3px solid ${color.accent};">
                    <tr>
                        <td style="vertical-align:top;padding:10px 12px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-family:Arial,sans-serif;font-size:11pt;font-weight:bold;color:#1a1a2e;">${item.nombre}</td>
                                    ${item.precio ? `<td style="text-align:right;font-family:Arial,sans-serif;font-weight:bold;color:${color.accent};font-size:11pt;white-space:nowrap;">$${item.precio}</td>` : ''}
                                </tr>
                                ${item.descripcion ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:8.5pt;color:#555;padding-top:3px;line-height:1.4;">${item.descripcion}</td></tr>` : ''}
                                ${meta ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:7.5pt;color:#999;padding-top:3px;">${meta}</td></tr>` : ''}
                            </table>
                        </td>
                        ${imgCell}
                    </tr>
                </table>`;
            });
        });

        return `<table width="794" cellpadding="0" cellspacing="0" style="background:#1a1a2e;font-family:Arial,sans-serif;color:white;width:794px;">
            <tr><td style="padding:40px 60px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr><td>
                        <span style="font-family:Arial,sans-serif;font-size:28pt;color:white;font-weight:900;letter-spacing:2px;text-transform:uppercase;">${titulo}</span>
                        ${subtitulo ? `<br><span style="font-family:Arial,sans-serif;font-size:9pt;color:#b07d54;letter-spacing:3px;">${subtitulo}</span>` : ''}
                    </td></tr>
                    <tr><td style="padding-top:12px;"><table cellpadding="0" cellspacing="0"><tr><td width="80" style="border-top:3px solid #b07d54;font-size:1px;">&nbsp;</td></tr></table></td></tr>
                </table>
                ${body}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr><td style="text-align:right;font-family:Arial,sans-serif;font-size:8pt;color:#b07d54;">CapiCafe — Menú Artesanal</td></tr>
                </table>
            </td></tr>
        </table>`;
    }

    function pdfMinimalista(titulo, subtitulo, secciones) {
        let body = '';
        secciones.forEach(sec => {
            if (sec.nombre) {
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;">
                    <tr>
                        <td width="20" style="border-top:1px solid #ccc;font-size:1px;">&nbsp;</td>
                        <td style="padding:0 12px;white-space:nowrap;">
                            <span style="font-family:Arial,sans-serif;font-size:8pt;color:#999;text-transform:uppercase;letter-spacing:4px;">${sec.nombre}</span>
                        </td>
                        <td style="border-top:1px solid #ccc;font-size:1px;">&nbsp;</td>
                    </tr>
                </table>`;
            }
            sec.items.filter(i => i.nombre).forEach(item => {
                const img = getItemImagen(item);
                const imgCell = img ? `<td width="65" style="vertical-align:top;padding-left:16px;">
                    <img src="${img}" width="56" height="56" style="border-radius:50%;object-fit:cover;display:block;" crossorigin="anonymous">
                </td>` : '';
                body += `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                    <tr>
                        <td style="vertical-align:top;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-family:Georgia,serif;font-size:11.5pt;color:#111;">${item.nombre}</td>
                                    ${item.precio ? `<td style="text-align:right;font-family:Georgia,serif;font-size:11pt;color:#111;white-space:nowrap;">$${item.precio}</td>` : ''}
                                </tr>
                                ${item.descripcion ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:8.5pt;color:#888;padding-top:2px;">${item.descripcion}</td></tr>` : ''}
                                ${(item.tiempo || item.ingredientes) ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:7.5pt;color:#bbb;padding-top:2px;">${[item.tiempo?`${item.tiempo}min`:'',item.ingredientes].filter(Boolean).join(' · ')}</td></tr>` : ''}
                            </table>
                        </td>
                        ${imgCell}
                    </tr>
                </table>`;
            });
        });

        return `<table width="794" cellpadding="0" cellspacing="0" style="background:white;font-family:Arial,sans-serif;color:#111;width:794px;">
            <tr><td style="padding:70px 80px 50px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:40px;border-bottom:1px solid #111;">
                    <tr><td style="padding-bottom:16px;">
                        <span style="font-family:Georgia,serif;font-size:22pt;color:#111;letter-spacing:6px;text-transform:uppercase;">${titulo}</span>
                        ${subtitulo ? `<br><span style="font-family:Arial,sans-serif;font-size:8pt;color:#999;letter-spacing:3px;">${subtitulo}</span>` : ''}
                    </td></tr>
                </table>
                ${body}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;border-top:1px solid #eee;">
                    <tr><td style="padding-top:10px;text-align:right;font-family:Arial,sans-serif;font-size:7pt;color:#ccc;letter-spacing:2px;text-transform:uppercase;">CapiCafe</td></tr>
                </table>
            </td></tr>
        </table>`;
    }

    // --- SETTINGS TOGGLE ---
    btnSettings.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
        btnSettings.classList.toggle('active');
    });

    // Template radio change
    document.querySelectorAll('input[name="template"]').forEach(radio => {
        radio.addEventListener('change', () => {
            actualizarTemplateUI(radio.value);
            guardarEnStorage();
        });
    });

    function actualizarTemplateUI(val) {
        document.querySelectorAll('.template-opt').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.template === val);
        });
    }

    // --- EVENTOS PRINCIPALES ---
    btnAddSection.addEventListener('click', () => {
        crearSeccion();
        window.actualizarPreview();
    });

    btnExportPdf.addEventListener('click', () => {
        const datos = recolectarDatos();
        const htmlString = generarHTMLParaPDF(datos);

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;z-index:-1;';
        container.innerHTML = htmlString;
        document.body.appendChild(container);

        const target = container.querySelector('table') || container;
        const opt = {
            margin: 0,
            filename: 'Menu-CapiCafe.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false, width: 794, windowWidth: 794, x: 0, y: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const btnText = btnExportPdf.textContent;
        btnExportPdf.textContent = '⏳ Generando...';
        btnExportPdf.disabled = true;

        setTimeout(() => {
            html2pdf().set(opt).from(target).save().then(() => {
                document.body.removeChild(container);
                btnExportPdf.textContent = btnText;
                btnExportPdf.disabled = false;
            });
        }, 150);
    });

    btnSaveMenu.addEventListener('click', () => {
        const datos = recolectarDatos();
        fetch('/api/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        }).then(() => alert('¡Menú guardado en el servidor!'));
    });

    cargarDatosGuardados();

});
