(function() {
    // ============================================================
    // TUTORIAL ENGINE — CapiCafe
    // ============================================================

    const STEPS = [
        {
            emoji: '☕',
            title: 'Bienvenido a CapiCafe',
            desc: 'Tu editor de menús artesanales. En 6 pasos rápidos aprenderás todo lo que necesitas para crear un menú profesional.',
            target: null,
            cardPos: 'center',
            btnText: 'Empezar →',
        },
        {
            emoji: '📂',
            title: 'Crea una sección',
            desc: 'Todo menú se organiza en secciones: <strong>Cafés</strong>, <strong>Panes</strong>, <strong>Postres</strong>... Haz clic en <em>"+ Sección"</em> para agregar la primera.',
            target: '#btn-add-section',
            cardPos: 'right',
            btnText: 'Siguiente →',
        },
        {
            emoji: '✏️',
            title: 'Nómbrala como quieras',
            desc: 'Haz clic en el nombre de la sección para editarlo. Cada sección tiene su propio color para distinguirse visualmente.',
            target: '.section-header',
            cardPos: 'right',
            btnText: 'Entendido →',
            fallbackTarget: '#btn-add-section',
        },
        {
            emoji: '🍰',
            title: 'Agrega productos',
            desc: 'Dentro de cada sección puedes agregar todos los productos que quieras con nombre, descripción, precio, tiempo e ingredientes.',
            target: '.btn-add-item-in-section',
            cardPos: 'right',
            btnText: 'Siguiente →',
            fallbackTarget: '#btn-add-section',
        },
        {
            emoji: '🖼️',
            title: 'Imágenes opcionales',
            desc: 'Cada producto puede tener una imagen. Puedes <strong>subir un archivo</strong> desde tu computadora o <strong>pegar un link URL</strong>. ¡Son completamente opcionales!',
            target: '.imagen-group',
            cardPos: 'right',
            btnText: 'Siguiente →',
            fallbackTarget: '.item-form',
        },
        {
            emoji: '⚙️',
            title: 'Personaliza tu menú',
            desc: 'Con el botón <strong>⚙</strong> puedes cambiar el título del menú, agregar un eslogan y elegir entre 3 plantillas de PDF: Clásico, Moderno o Minimal.',
            target: '#btn-settings',
            cardPos: 'bottom-right',
            btnText: 'Siguiente →',
        },
        {
            emoji: '📄',
            title: 'Exporta tu menú en PDF',
            desc: 'Cuando termines, haz clic en <em>"⬇ PDF"</em> y tu menú se descargará listo para imprimir o compartir. ¡Así de fácil!',
            target: '#btn-export-pdf',
            cardPos: 'top-right',
            btnText: '¡Listo! Crear mi menú →',
        },
    ];

    let currentStep = 0;
    let isRunning = false;

    const overlay   = document.getElementById('tutorial-overlay');
    const canvas    = document.getElementById('tutorial-canvas');
    const ctx       = canvas.getContext('2d');
    const spotlight = document.getElementById('tutorial-spotlight');
    const card      = document.getElementById('tutorial-card');
    const arrow     = document.getElementById('tutorial-arrow');
    const badge     = document.getElementById('tutorial-badge');
    const emojiEl   = document.getElementById('tutorial-emoji');
    const titleEl   = document.getElementById('tutorial-title');
    const descEl    = document.getElementById('tutorial-desc');
    const progressBar = document.getElementById('tutorial-progress-bar');
    const btnNext   = document.getElementById('tutorial-next');
    const btnSkip   = document.getElementById('tutorial-skip');
    const btnTutorial = document.getElementById('btn-tutorial');

    // ---- CANVAS OVERLAY ----
    let canvasHole = null; // { x, y, w, h, r }
    let animFrame = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawCanvas();
    }

    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(20, 12, 6, 0.74)';

        if (canvasHole) {
            const { x, y, w, h, r } = canvasHole;
            // Fill everything EXCEPT the rounded rect hole
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            // Cut out rounded rect (counter-clockwise = hole)
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
            ctx.evenOddRule = true;
            ctx.fill('evenodd');
        } else {
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Smooth animated hole transition
    let holeTarget = null;
    let holeCurrent = null;

    function animateHole() {
        if (!holeTarget) { drawCanvas(); return; }

        if (!holeCurrent) {
            holeCurrent = { ...holeTarget };
        } else {
            const ease = 0.12;
            holeCurrent.x += (holeTarget.x - holeCurrent.x) * ease;
            holeCurrent.y += (holeTarget.y - holeCurrent.y) * ease;
            holeCurrent.w += (holeTarget.w - holeCurrent.w) * ease;
            holeCurrent.h += (holeTarget.h - holeCurrent.h) * ease;
        }

        canvasHole = holeCurrent;
        drawCanvas();
        animFrame = requestAnimationFrame(animateHole);
    }

    function setHole(rect, pad, r) {
        holeTarget = {
            x: rect.left - pad,
            y: rect.top - pad,
            w: rect.width + pad * 2,
            h: rect.height + pad * 2,
            r: r || 12
        };
        if (!holeCurrent) holeCurrent = { ...holeTarget };
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(animateHole);
    }

    function clearHole() {
        holeTarget = null;
        holeCurrent = null;
        canvasHole = null;
        if (animFrame) cancelAnimationFrame(animFrame);
        drawCanvas();
    }

    window.addEventListener('resize', resizeCanvas);

    // ---- PUBLIC ----
    window.startTutorial = startTutorial;

    btnTutorial.addEventListener('click', startTutorial);
    btnNext.addEventListener('click', nextStep);
    btnSkip.addEventListener('click', endTutorial);

    // Click anywhere on overlay (not card) to advance
    overlay.addEventListener('click', function(e) {
        if (!e.target.closest('.tutorial-card') && !e.target.closest('.tutorial-btn-next') && !e.target.closest('.tutorial-btn-skip')) {
            nextStep();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (!isRunning) return;
        if (e.key === 'Escape') endTutorial();
        if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep();
    });

    function startTutorial() {
        currentStep = 0;
        isRunning = true;
        resizeCanvas();
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
        renderStep(currentStep, 'forward');
    }

    function nextStep() {
        if (currentStep >= STEPS.length - 1) {
            endTutorial();
            return;
        }
        currentStep++;
        renderStep(currentStep, 'forward');
    }

    function endTutorial() {
        isRunning = false;
        clearHole();
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        setTimeout(() => {
            card.style.opacity = '';
            card.style.transform = '';
        }, 300);
    }

    function renderStep(index, direction) {
        const step = STEPS[index];
        const total = STEPS.length;

        // Update progress bar
        progressBar.style.width = ((index) / (total - 1) * 100) + '%';

        // Update badge
        badge.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

        // Animate card content out then in
        card.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        card.style.opacity = '0';
        card.style.transform = direction === 'forward' ? 'translateX(10px)' : 'translateX(-10px)';

        setTimeout(() => {
            // Update content
            emojiEl.textContent = step.emoji;
            titleEl.textContent = step.title;
            descEl.innerHTML = step.desc;
            btnNext.textContent = step.btnText || 'Siguiente →';

            // Show/hide skip
            btnSkip.style.display = index === total - 1 ? 'none' : 'inline';

            // Position spotlight + card
            positionForStep(step);

            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 180);
    }

    function positionForStep(step) {
        let targetEl = null;
        if (step.target) {
            targetEl = document.querySelector(step.target);
            if (!targetEl && step.fallbackTarget) {
                targetEl = document.querySelector(step.fallbackTarget);
            }
        }

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();
            const pad = 10;
            const r = 10;
            // Canvas hole (the clear cutout)
            setHole(rect, pad, r);
            // Spotlight border ring (visible outline, not blurred)
            spotlight.style.display = 'block';
            spotlight.style.left = (rect.left - pad) + 'px';
            spotlight.style.top = (rect.top - pad) + 'px';
            spotlight.style.width = (rect.width + pad * 2) + 'px';
            spotlight.style.height = (rect.height + pad * 2) + 'px';
            spotlight.classList.remove('hidden-spot');
        } else {
            clearHole();
            spotlight.classList.add('hidden-spot');
            spotlight.style.display = 'none';
        }

        placeCard(step.cardPos, targetEl);
    }

    function placeCard(position, targetEl) {
        const cardW = 320;
        const cardH = 280; // approx
        const margin = 18;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        arrow.className = 'tutorial-arrow';
        arrow.style.display = 'none';

        let left, top;

        if (!targetEl || position === 'center') {
            // Center of screen
            left = (vw - cardW) / 2;
            top = (vh - cardH) / 2;
            card.style.left = left + 'px';
            card.style.top = top + 'px';
            card.style.right = 'auto';
            card.style.bottom = 'auto';
            return;
        }

        const rect = targetEl.getBoundingClientRect();

        if (position === 'right') {
            left = rect.right + margin + 14;
            top = Math.max(20, rect.top - 20);
            // Clamp bottom
            if (top + cardH > vh - 20) top = vh - cardH - 20;
            // Arrow pointing left (to target)
            arrow.style.display = 'block';
            arrow.classList.add('arrow-left');
            arrow.style.left = (left - 12) + 'px';
            arrow.style.top = (Math.min(rect.top + rect.height/2, top + 60) - 10) + 'px';
            arrow.style.right = 'auto';
            arrow.style.bottom = 'auto';
        } else if (position === 'bottom-right') {
            left = rect.right + margin;
            top = rect.bottom + margin;
            if (left + cardW > vw - 10) left = vw - cardW - 10;
            arrow.style.display = 'block';
            arrow.classList.add('arrow-up');
            arrow.style.left = (rect.left + rect.width/2 - 10) + 'px';
            arrow.style.top = (rect.bottom + 2) + 'px';
            arrow.style.right = 'auto';
            arrow.style.bottom = 'auto';
        } else if (position === 'top-right') {
            left = rect.right + margin;
            top = rect.top - cardH - margin;
            if (top < 10) { top = rect.bottom + margin; }
            if (left + cardW > vw - 10) left = vw - cardW - 10;
            arrow.style.display = 'block';
            arrow.classList.add('arrow-down');
            arrow.style.left = (rect.left + rect.width/2 - 10) + 'px';
            arrow.style.top = (top + cardH) + 'px';
            arrow.style.right = 'auto';
            arrow.style.bottom = 'auto';
        } else {
            left = (vw - cardW) / 2;
            top = (vh - cardH) / 2;
        }

        // Safety clamps
        left = Math.max(10, Math.min(left, vw - cardW - 10));
        top = Math.max(10, Math.min(top, vh - cardH - 10));

        card.style.left = left + 'px';
        card.style.top = top + 'px';
        card.style.right = 'auto';
        card.style.bottom = 'auto';
    }
})();