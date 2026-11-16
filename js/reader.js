/* ============================================================
   Reader — main controller
   - Renders chapters from EBOOK_CONTENT
   - Manages TOC sidebar, settings panel, share modal
   - Audio (TTS) playback UI
   - Reading progress, scroll spy, persistent settings
   ============================================================ */

(function () {
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    // ── State ──────────────────────────────────────────────────
    const state = {
        currentChapter: null,
        settings: {
            theme: localStorage.getItem('ebook-theme') || 'day',
            font: localStorage.getItem('ebook-font') || 'serif',
            fontSize: parseInt(localStorage.getItem('ebook-fontsize') || '17', 10),
            lineHeight: parseInt(localStorage.getItem('ebook-lineheight') || '180', 10) / 100,
        },
        audio: {
            visible: false,
            isPlaying: false,
            speed: 1.0,
        },
    };

    // ── Render book content ────────────────────────────────────
    // Official front-matter sections start collapsed (expandable)
    const DEFAULT_COLLAPSED = ['fm-pub', 'fm-bani', 'fm-mukho'];

    // Author's other ebooks + portfolio (injected into About section and book-end)
    const AUTHOR_LINKS = `
<div class="author-links">
  <span class="author-links-label">লেখকের আরও ই-বুক ও পোর্টফোলিও</span>
  <div class="author-links-grid">
    <a class="author-chip" data-author-link="self_learning" href="https://moniruzjaman.github.io/self-learning/" target="_blank" rel="noopener" title="স্বশিক্ষা ও স্বনির্ভরতার কৃষি — ই-বুক">📘 স্বশিক্ষা ও স্বনির্ভরতার কৃষি</a>
    <a class="author-chip" data-author-link="bangladesh_zindabad" href="https://moniruzjaman.github.io/bangladesh-zindabad/" target="_blank" rel="noopener" title="বাংলাদেশ জিন্দাবাদ — ই-বুক">📗 বাংলাদেশ জিন্দাবাদ</a>
    <a class="author-chip" data-author-link="rashtra_teen_chokhe" href="https://moniruzjaman.github.io/rashtra_teen_chokhe/read.html" target="_blank" rel="noopener" title="রাষ্ট্রকে দেখা তিন চোখে — ই-বুক">📕 রাষ্ট্রকে দেখা তিন চোখে</a>
    <a class="author-chip" data-author-link="portfolio" href="https://moniruzjaman.github.io/portfolio/" target="_blank" rel="noopener" title="লেখকের পোর্টফোলিও">👨‍💼 লেখকের পোর্টফোলিও</a>
  </div>
</div>`;

    // Official government fertilizer recommendation card tool (SRDI — frs-bd.com).
    // Injected into the About section and the book-end card.
    const OFFICIAL_LINKS = `
<div class="official-links">
  <span class="official-links-label">অফিসিয়াল সার সুপারিশ কার্ড — সরকারি অনলাইন টুল</span>
  <a class="official-card" data-official-link="frs_bd" href="http://www.frs-bd.com/" target="_blank" rel="noopener" title="FRS-BD — ফসল ও মাটি অনুযায়ী সার সুপারিশ কার্ড">
    <svg class="official-card-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="9" x2="17" y2="9"/><line x1="7" y1="12.5" x2="14" y2="12.5"/><line x1="7" y1="16" x2="11" y2="16"/><path d="M17 15l2 2 4-4" transform="scale(0.62) translate(6.5 9)"/></svg>
    <span class="official-card-body">
      <strong class="official-card-title">FRS-BD — সার সুপারিশ কার্ড তৈরি করুন</strong>
      <span class="official-card-desc">বিভাগ, জেলা, উপজেলা, মাটির ধরন ও ফসলের মৌসুম বেছে নিয়ে ফসলভিত্তিক অফিসিয়াল সার সুপারিশ কার্ড তৈরি ও প্রিন্ট করুন (www.frs-bd.com)</span>
    </span>
    <span class="official-card-arrow" aria-hidden="true">→</span>
  </a>
</div>`;

    // ── Visual handbook slides (courtesy: fertilizer-handbook-2024) ─
    // 42 BARC presentation slides, 1376×768 WebP, runtime-cached on demand
    const SLIDE_COUNT = 42;
    const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
    const SLIDE_SRC = (i) => `assets/slides/${String(i).padStart(2, '0')}.webp`;
    const SLIDE_PDF = 'assets/slides/FRG-2024-Visual-Handbook.pdf';

    function renderSlidesSection() {
        const tiles = [];
        for (let i = 1; i <= SLIDE_COUNT; i++) {
            tiles.push(`
    <button class="slide-thumb" data-slide="${i}" type="button" aria-label="স্লাইড ${bnNum(i)} দেখুন">
      <img loading="lazy" src="${SLIDE_SRC(i)}" alt="ভিজ্যুয়াল হ্যান্ডবুক — স্লাইড ${bnNum(i)}" width="1376" height="768">
      <span class="slide-thumb-num">${bnNum(i)}</span>
    </button>`);
        }
        return `
<section class="chapter slides-section" id="slides" data-chapter="slides" data-num="স্লাইড">
  <div class="chapter-header">
    <span class="chapter-num">স্লাইড</span>
    <h2 class="chapter-title">ভিজ্যুয়াল হ্যান্ডবুক স্লাইড</h2>
    <p class="chapter-subtitle">সার সুপারিশমালা হ্যান্ডবই-২০২৪ · টেকসই মৃত্তিকা ব্যবস্থাপনা ও ফসল উৎপাদন — ${bnNum(SLIDE_COUNT)} স্লাইডে ভিজ্যুয়াল উপস্থাপনা</p>
  </div>
  <div class="chapter-body">
    <p class="frg-para">বিএআরসির <b>ভিজ্যুয়াল হ্যান্ডবুক</b> উপস্থাপনার ${bnNum(SLIDE_COUNT)}টি স্লাইড — মাটির পুষ্টি নির্ণায়ক, সুষম সার ব্যবস্থাপনা ও ফসল উৎপাদনের মূল বার্তাগুলো ছবিতে। যেকোনো স্লাইডে চাপ দিলে পুরো পর্দায় খুলে যাবে; ← → বোতাম বা কিবোর্ডের তীর কী দিয়ে এগিয়ে-পিছিয়ে যান।</p>
    <div class="slides-grid">${tiles.join('')}</div>
    <div class="slides-pdf-row">
      <a class="btn-secondary slides-pdf-btn" href="${SLIDE_PDF}" target="_blank" rel="noopener" data-slides-pdf="1">📄 সম্পূর্ণ ভিজ্যুয়াল হ্যান্ডবুক (PDF) দেখুন</a>
    </div>
    <p class="slides-credit">উপস্থাপনা: বাংলাদেশ কৃষি গবেষণা কাউন্সিল (বিএআরসি) · সৌজন্যে fertilizer-handbook-2024</p>
  </div>
</section>`;
    }

    // Slide viewer (lightbox)
    let slideIdx = 0;

    function slideKeyHandler(e) {
        if (e.key === 'ArrowLeft') slideNav(-1);
        else if (e.key === 'ArrowRight') slideNav(1);
        else if (e.key === 'Escape') closeSlideViewer();
    }

    function paintSlide() {
        const img = document.getElementById('slideImg');
        img.src = SLIDE_SRC(slideIdx);
        img.alt = `ভিজ্যুয়াল হ্যান্ডবুক — স্লাইড ${bnNum(slideIdx)}`;
        document.getElementById('slideCount').textContent = `স্লাইড ${bnNum(slideIdx)} / ${bnNum(SLIDE_COUNT)}`;
        // Preload neighbours for snappy navigation
        [slideIdx - 1, slideIdx + 1].forEach((n) => {
            if (n >= 1 && n <= SLIDE_COUNT) { const p = new Image(); p.src = SLIDE_SRC(n); }
        });
    }

    function slideNav(dir) {
        const next = slideIdx + dir;
        if (next < 1 || next > SLIDE_COUNT) return;
        slideIdx = next;
        paintSlide();
    }

    function openSlideViewer(i) {
        slideIdx = i;
        let v = document.getElementById('slideViewer');
        if (!v) {
            v = document.createElement('div');
            v.id = 'slideViewer';
            v.className = 'slide-viewer';
            v.innerHTML = `
  <div class="slide-viewer-backdrop" data-slide-close="1"></div>
  <div class="slide-viewer-bar">
    <span class="slide-viewer-count" id="slideCount"></span>
    <a class="slide-viewer-pdf" href="${SLIDE_PDF}" target="_blank" rel="noopener" title="সম্পূর্ণ ভিজ্যুয়াল হ্যান্ডবুক PDF দেখুন">📄 PDF</a>
    <button class="slide-viewer-close" id="slideClose" type="button" aria-label="বন্ধ করুন">✕</button>
  </div>
  <img class="slide-viewer-img" id="slideImg" src="" alt="ভিজ্যুয়াল হ্যান্ডবুক স্লাইড">
  <button class="slide-viewer-nav slide-prev" id="slidePrev" type="button" aria-label="আগের স্লাইড">‹</button>
  <button class="slide-viewer-nav slide-next" id="slideNext" type="button" aria-label="পরের স্লাইড">›</button>`;
            document.body.appendChild(v);
            v.querySelector('#slideClose').addEventListener('click', closeSlideViewer);
            v.querySelector('#slidePrev').addEventListener('click', () => slideNav(-1));
            v.querySelector('#slideNext').addEventListener('click', () => slideNav(1));
        }
        paintSlide();
        v.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', slideKeyHandler);
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('slides_open', { slide_index: bnNum(i), total: SLIDE_COUNT });
    }

    function closeSlideViewer() {
        const v = document.getElementById('slideViewer');
        if (v) v.classList.remove('open');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', slideKeyHandler);
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('slides_close', {});
    }

    function renderBook() {
        const root = $('#bookContent');
        const html = [];

        const renderChapter = (ch) => {
            const epigraph = ch.epigraph
                ? `<div class="epigraph">${ch.epigraph}</div>`
                : '';
            const collapsed = DEFAULT_COLLAPSED.includes(ch.id);
            return `
<section class="chapter${collapsed ? ' is-collapsed' : ''}" id="${ch.id}" data-chapter="${ch.id}" data-num="${ch.numLabel}">
  <div class="chapter-toggle" role="button" tabindex="0" aria-expanded="${collapsed ? 'false' : 'true'}" aria-controls="${ch.id}-body" title="খুলতে/বন্ধ করতে ক্লিক করুন">
    <div class="chapter-header">
      <span class="chapter-num">${ch.numLabel}</span>
      <h2 class="chapter-title">${ch.title}</h2>
      <p class="chapter-subtitle">${ch.subtitle}</p>
    </div>
    <span class="chapter-chevron" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </span>
  </div>
  ${epigraph}
  <div class="chapter-body" id="${ch.id}-body">${ch.html}</div>
</section>`;
        };

        // Chapters
        for (const ch of EBOOK_CONTENT.chapters) {
            html.push(renderChapter(ch));
        }
        // Interactive, glossary, resources, about
        html.push(renderChapter(EBOOK_CONTENT.interactive));
        html.push(renderChapter(EBOOK_CONTENT.glossary));
        html.push(renderChapter(EBOOK_CONTENT.resources));
        html.push(renderChapter(EBOOK_CONTENT.about));
        html.push(renderSlidesSection());

        root.innerHTML = html.join('\n');

        // Mobile-first: wrap wide tables in horizontally scrollable containers
        $$('table', root).forEach((t) => {
            if (t.parentElement && t.parentElement.classList.contains('table-scroll')) return;
            const wrap = document.createElement('div');
            wrap.className = 'table-scroll';
            t.parentNode.insertBefore(wrap, t);
            wrap.appendChild(t);
        });

        // Author links: append to About section and book-end card
        const aboutBody = $('#about .chapter-body');
        if (aboutBody) aboutBody.insertAdjacentHTML('beforeend', AUTHOR_LINKS + OFFICIAL_LINKS);
        const endFoot = $('#bookEnd .book-end-foot');
        if (endFoot) endFoot.insertAdjacentHTML('beforebegin', AUTHOR_LINKS + OFFICIAL_LINKS);

        restoreCollapse();
    }

    // ── Render TOC sidebar ─────────────────────────────────────
    function renderToc() {
        const nav = $('#tocNav');
        const html = [];
        for (const item of EBOOK_TOC) {
            if (item.section) {
                html.push(`<div class="toc-section-header">${item.section}</div>`);
            } else {
                html.push(`
<a href="#${item.id}" class="toc-item" data-target="${item.id}">
  <span class="toc-num">${item.num}</span>
  <span class="toc-text-block">
    <span class="toc-item-title">${item.title}</span>
    <span class="toc-item-sub">${item.sub}</span>
  </span>
</a>`);
            }
        }
        nav.innerHTML = '<div class="toc-bookmarks" id="tocBookmarks"></div>' + html.join('');
    }

    // ── Apply settings ─────────────────────────────────────────
    function applySettings() {
        document.documentElement.setAttribute('data-theme', state.settings.theme);
        document.documentElement.style.setProperty('--font-size', state.settings.fontSize + 'px');
        document.documentElement.style.setProperty('--line-height', state.settings.lineheight || state.settings.lineHeight);
        // Font family
        if (state.settings.font === 'sans') {
            document.documentElement.style.setProperty('--font-body', "'NotoSansBengali', sans-serif");
            document.documentElement.style.setProperty('--font-head', "'NotoSansBengali', sans-serif");
        } else {
            document.documentElement.style.setProperty('--font-body', "'NotoSerifBengali', serif");
            document.documentElement.style.setProperty('--font-head', "'NotoSansBengali', sans-serif");
        }
        // Update UI controls
        $('#fontSizeRange').value = state.settings.fontSize;
        $('#fontSizeValue').textContent = state.settings.fontSize + 'px';
        $('#lineHeightRange').value = Math.round(state.settings.lineHeight * 100);
        $('#lineHeightValue').textContent = state.settings.lineHeight.toFixed(2);
        $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.settings.theme));
        $$('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.font === state.settings.font));
    }

    // ── Sidebar / panel toggle helpers ────────────────────────
    function openToc() {
        $('#tocSidebar').classList.add('open');
        $('#tocOverlay').classList.add('visible');
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.tocOpen();
    }
    function closeToc() {
        $('#tocSidebar').classList.remove('open');
        $('#tocOverlay').classList.remove('visible');
    }
    function openSettings() {
        $('#settingsPanel').classList.add('open');
        $('#settingsOverlay').classList.add('visible');
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.settingsOpen();
    }
    function closeSettings() {
        $('#settingsPanel').classList.remove('open');
        $('#settingsOverlay').classList.remove('visible');
    }

    // ── Share modal ────────────────────────────────────────────
    function openShare(chapterId) {
        $('#shareModal').classList.add('visible');
        $('#shareLinkInput').value = chapterId
            ? `https://moniruzjaman.github.io/frg-2024-ebook/#${chapterId}`
            : 'https://moniruzjaman.github.io/frg-2024-ebook/';
        // Hide native share button if unsupported
        $('#btnNativeShare').style.display = EBOOK_SHARE.isNativeSupported() ? '' : 'none';
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.shareModalOpen(chapterId);
    }
    function closeShare() {
        $('#shareModal').classList.remove('visible');
    }

    // ── Audio (TTS) UI ─────────────────────────────────────────
    function showAudioBar() {
        $('#audioBar').classList.add('visible');
        document.body.classList.add('audio-visible');
        state.audio.visible = true;
    }
    function hideAudioBar() {
        $('#audioBar').classList.remove('visible');
        document.body.classList.remove('audio-visible');
        state.audio.visible = false;
    }
    function setAudioPlayIcon(playing) {
        const icon = $('#audioPlayIcon');
        if (playing) {
            // Pause icon
            icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        } else {
            // Play icon
            icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    }
    function updateAudioProgress(pct) {
        $('#audioProgressFill').style.width = pct + '%';
    }

    function startChapterAudio(chapterId) {
        // Find chapter
        const all = [
            ...EBOOK_CONTENT.chapters,
            EBOOK_CONTENT.interactive,
            EBOOK_CONTENT.glossary,
            EBOOK_CONTENT.resources,
            EBOOK_CONTENT.about,
        ];
        const ch = all.find(c => c.id === chapterId);
        if (!ch || !ch.ttsText) {
            alert('এই অধ্যায়ের জন্য অডিও উপলব্ধ নেই।');
            return;
        }

        if (!EBOOK_TTS.init()) {
            alert('আপনার ব্রাউজারে Speech Synthesis সাপোর্ট নেই। অডিও ফিচার ব্যবহার করা যাবে না।');
            return;
        }

        // If same chapter and playing, toggle pause/resume
        if (state.audio.isPlaying && EBOOK_TTS.currentChapter === chapterId) {
            if (EBOOK_TTS.isPaused) {
                EBOOK_TTS.resume();
                setAudioPlayIcon(true);
            } else {
                EBOOK_TTS.pause();
                setAudioPlayIcon(false);
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.ttsPause(chapterId);
            }
            return;
        }

        // Stop any previous
        EBOOK_TTS.stop();

        // Show audio bar with chapter title
        $('#audioTitle').textContent = ch.title;
        showAudioBar();
        setAudioPlayIcon(true);
        state.audio.isPlaying = true;

        // Wire callbacks
        EBOOK_TTS.onProgress = (info) => {
            updateAudioProgress(info.progress);
        };
        EBOOK_TTS.onEnd = (cid) => {
            setAudioPlayIcon(false);
            state.audio.isPlaying = false;
            updateAudioProgress(100);
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.ttsComplete(cid);
            setTimeout(() => {
                if (EBOOK_TTS.currentChapter === cid) {
                    updateAudioProgress(0);
                }
            }, 1500);
        };

        EBOOK_TTS.play(chapterId, ch.ttsText, { speed: state.audio.speed });
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.ttsPlay(chapterId, ch.title);
    }

    function stopAudio() {
        EBOOK_TTS.stop();
        setAudioPlayIcon(false);
        state.audio.isPlaying = false;
        updateAudioProgress(0);
        hideAudioBar();
    }

    // ── Progress bar + scroll spy ──────────────────────────────
    function onScroll() {
        // Progress
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        $('#progressBar').style.width = Math.min(100, pct) + '%';

        // Scroll spy — find current chapter
        const chapters = $$('section.chapter, section.hero');
        let current = null;
        for (const ch of chapters) {
            const rect = ch.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.35) {
                current = ch;
            } else {
                break;
            }
        }
        if (current && current.id !== state.currentChapter) {
            const prevChapter = state.currentChapter;
            state.currentChapter = current.id;
            updateActiveToc(current.id);
            // Update topbar title
            const data = current.dataset;
            if (data && data.num) {
                $('#topbarChapter').textContent = data.num + ' · ' + (current.querySelector('.chapter-title')?.textContent || '');
            } else if (current.id === 'hero') {
                $('#topbarChapter').textContent = EBOOK_CONTENT.subtitle;
            }
            // Analytics: chapter_read event when entering a chapter
            if (current.id !== 'hero' && current.id !== prevChapter) {
                const chTitle = current.querySelector('.chapter-title')?.textContent || current.id;
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.chapterRead(current.id, chTitle);
            }
            // Save last position (resume feature) + refresh bookmark button
            if (current.id !== 'hero') {
                try {
                    localStorage.setItem('ebook-last', JSON.stringify({
                        id: current.id,
                        num: (current.dataset && current.dataset.num) || '',
                        title: current.querySelector('.chapter-title')?.textContent || '',
                    }));
                } catch (e) { /* storage unavailable */ }
            }
            updateBookmarkBtn();
        }
        // Analytics: reading progress (per chapter, milestone-based)
        if (state.currentChapter && state.currentChapter !== 'hero') {
            const cur = document.getElementById(state.currentChapter);
            if (cur) {
                const rect = cur.getBoundingClientRect();
                const chHeight = cur.offsetHeight;
                if (chHeight > 0) {
                    // % of chapter that has been scrolled past
                    const scrolledInCh = Math.max(0, -rect.top);
                    const visiblePortion = Math.min(chHeight, window.innerHeight - rect.top);
                    const progress = Math.min(100, Math.max(0, (scrolledInCh / (chHeight + window.innerHeight * 0.5)) * 100));
                    if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.readingProgress(state.currentChapter, progress);
                }
            }
        }

        // Back-to-top FAB + chapter quick-nav
        const fabTop = $('#fabTop');
        if (fabTop) fabTop.classList.toggle('visible', scrollTop > 700);
        updateChapterNav();
    }

    function updateActiveToc(chapterId) {
        $$('.toc-item').forEach(item => {
            item.classList.toggle('active', item.dataset.target === chapterId);
        });
        // Auto-scroll TOC to active item
        const active = $('.toc-item.active');
        if (active) {
            const nav = $('#tocNav');
            const navRect = nav.getBoundingClientRect();
            const itemRect = active.getBoundingClientRect();
            if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
                active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }

    // ── Interactive widgets: quiz score + saved state ─────────
    function updateQuizScore() {
        const el = $('#quizScore');
        if (!el) return;
        const questions = $$('.quiz-question');
        if (!questions.length) return;
        const answered = questions.filter(q => q.classList.contains('answered')).length;
        const correct = questions.filter(q => q.classList.contains('answered') && q.dataset.chosen === q.dataset.correct).length;
        let suffix = '';
        if (answered === questions.length) {
            suffix = correct === questions.length
                ? ' · 🎉 অভিনন্দন — সবগুলো সঠিক!'
                : ' · ব্যাখ্যাগুলো পড়ে সংশ্লিষ্ট অধ্যায় আবার দেখুন';
        }
        el.innerHTML = 'উত্তর দেওয়া হয়েছে: <b>' + answered + '</b>/১০ · সঠিক উত্তর: <b>' + correct + '</b>' + suffix;
    }

    function restoreInteractivity() {
        // Action plan checks
        const done = JSON.parse(localStorage.getItem('ebook-actionplan') || '[]');
        const rows = $$('.action-row');
        done.forEach(i => {
            if (rows[i]) rows[i].querySelector('.check')?.classList.add('done');
        });
        // Quiz answers
        const answers = JSON.parse(localStorage.getItem('ebook-quiz') || '[]');
        const questions = $$('.quiz-question');
        questions.forEach((q, qi) => {
            const chosen = answers[qi];
            if (chosen === undefined || chosen === null) return;
            const options = $$('.quiz-options li', q);
            if (!options[chosen]) return;
            const correct = parseInt(q.dataset.correct, 10);
            q.classList.add('answered');
            q.dataset.chosen = String(chosen);
            options.forEach((li, i) => {
                if (i === correct) li.classList.add('correct');
                if (i === chosen && chosen !== correct) li.classList.add('wrong');
            });
            q.querySelector('.quiz-explain')?.classList.add('show');
        });
        updateQuizScore();
    }

    // ── Collapsible chapters ──────────────────────────────────
    function saveCollapsed() {
        localStorage.setItem('ebook-collapsed', JSON.stringify($$('.chapter.is-collapsed').map(s => s.id)));
    }

    function setCollapsed(section, collapsed) {
        if (!section) return;
        section.classList.toggle('is-collapsed', collapsed);
        section.querySelector('.chapter-toggle')?.setAttribute('aria-expanded', String(!collapsed));
    }

    function toggleChapter(toggleEl) {
        const section = toggleEl.closest('section.chapter');
        if (!section) return;
        setCollapsed(section, !section.classList.contains('is-collapsed'));
        saveCollapsed();
    }

    function restoreCollapse() {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem('ebook-collapsed')); } catch (_) { /* ignore */ }
        if (!Array.isArray(saved)) return; // first visit — keep rendered defaults
        $$('.chapter').forEach((s) => setCollapsed(s, saved.includes(s.id)));
    }

    function expandAllChapters() {
        $$('.chapter').forEach((s) => setCollapsed(s, false));
        saveCollapsed();
    }

    function collapseAllChapters() {
        // Never collapse the chapter the reader is currently in
        $$('.chapter').forEach((s) => setCollapsed(s, s.id !== state.currentChapter));
        saveCollapsed();
    }

    // ── Chapter quick navigation (bottom bar) ─────────────────
    let navBusy = false;

    function navSections() {
        return $$('section.chapter');
    }

    function gotoChapter(id) {
        closeToc();
        closeSettings();
        closeShare();
        closeSearch();
        closeNotes();
        hideHlToolbar();
        const el = document.getElementById(id);
        if (el) {
            // Auto-expand collapsed targets (e.g., TOC link to an intro)
            if (el.classList.contains('is-collapsed')) {
                setCollapsed(el, false);
                saveCollapsed();
            }
            el.scrollIntoView({ behavior: 'smooth' });
            history.replaceState(null, '', '#' + id);
        }
    }

    function gotoChapterNav(dir) {
        // Ignore extra presses while a smooth scroll is in flight —
        // otherwise the scroll-spy's mid-flight position causes skips
        if (navBusy) return;
        const sections = navSections();
        const idx = sections.findIndex(s => s.id === state.currentChapter);
        if (idx < 0) return;
        const target = sections[idx + dir];
        if (!target) return;
        navBusy = true;
        gotoChapter(target.id);
        const clear = () => {
            navBusy = false;
            window.removeEventListener('scrollend', clear);
        };
        window.addEventListener('scrollend', clear);
        setTimeout(clear, 2500); // safety for browsers without scrollend
    }

    function updateChapterNav() {
        const nav = $('#chapterNav');
        if (!nav) return;
        const cur = state.currentChapter;
        if (!cur || cur === 'hero') { nav.classList.remove('visible'); return; }
        const sections = navSections();
        const idx = sections.findIndex(s => s.id === cur);
        if (idx < 0) { nav.classList.remove('visible'); return; }
        const btnP = $('#chNavPrev'), btnN = $('#chNavNext');
        const prev = sections[idx - 1], next = sections[idx + 1];
        const labelFor = (s) => {
            const t = (s.querySelector('.chapter-title')?.textContent || '').trim();
            return (s.dataset.num || '') + ' · ' + (t.length > 26 ? t.slice(0, 26) + '…' : t);
        };
        if (prev) {
            btnP.style.display = '';
            $('#chNavPrevLabel').textContent = labelFor(prev);
        } else {
            btnP.style.display = 'none';
        }
        if (next) {
            btnN.style.display = '';
            $('#chNavNextLabel').textContent = labelFor(next);
        } else {
            btnN.style.display = 'none';
        }
        nav.classList.add('visible');
    }

    // ── Event wiring ───────────────────────────────────────────
    function wireEvents() {
        // Topbar
        $('#btnHome').addEventListener('click', () => {
            closeToc();
            closeSettings();
            closeShare();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            history.replaceState(null, '', '#');
        });
        $('#btnToc').addEventListener('click', openToc);
        $('#btnCloseToc').addEventListener('click', closeToc);
        $('#tocOverlay').addEventListener('click', closeToc);

        $('#btnSettings').addEventListener('click', openSettings);
        $('#btnCloseSettings').addEventListener('click', closeSettings);
        $('#settingsOverlay').addEventListener('click', closeSettings);

        $('#btnShare').addEventListener('click', () => openShare(state.currentChapter === 'hero' ? null : state.currentChapter));
        $('#fabShare').addEventListener('click', () => openShare(state.currentChapter === 'hero' ? null : state.currentChapter));
        $('#btnCloseShare').addEventListener('click', closeShare);
        $('#shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') closeShare();
        });

        $('#btnAudio').addEventListener('click', () => {
            if (state.currentChapter && state.currentChapter !== 'hero') {
                startChapterAudio(state.currentChapter);
            } else {
                // Start chapter 1 if at hero
                startChapterAudio('ch1');
                // Scroll to ch1
                document.getElementById('ch1')?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Audio bar controls
        $('#audioPlay').addEventListener('click', () => {
            if (state.audio.isPlaying) {
                if (EBOOK_TTS.isPaused) {
                    EBOOK_TTS.resume();
                    setAudioPlayIcon(true);
                } else {
                    EBOOK_TTS.pause();
                    setAudioPlayIcon(false);
                }
            } else if (EBOOK_TTS.currentChapter) {
                // Narration had ended — restart the chapter from the beginning
                startChapterAudio(EBOOK_TTS.currentChapter);
            }
        });
        $('#audioStop').addEventListener('click', stopAudio);
        $('#fabTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        $('#chNavPrev').addEventListener('click', () => gotoChapterNav(-1));
        $('#chNavNext').addEventListener('click', () => gotoChapterNav(1));
        $('#audioSpeed').addEventListener('change', (e) => {
            state.audio.speed = parseFloat(e.target.value);
            EBOOK_TTS.setSpeed(state.audio.speed);
        });
        $('#audioProgress').addEventListener('click', (e) => {
            // Visual feedback only — Web Speech API doesn't support seek
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            updateAudioProgress(pct);
        });

        // Share buttons
        $$('.share-btn[data-share]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const platform = btn.dataset.share;
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.shareClick(platform, state.currentChapter);
                if (platform === 'copy') {
                    const ok = await EBOOK_SHARE.copyLink();
                    btn.querySelector('span').textContent = ok ? 'কপি হয়েছে!' : 'ব্যর্থ';
                    setTimeout(() => btn.querySelector('span').textContent = 'লিঙ্ক কপি', 1500);
                    if (ok && window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.shareComplete(platform);
                } else {
                    await EBOOK_SHARE.share(platform, { chapter: state.currentChapter });
                    if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.shareComplete(platform);
                }
            });
        });
        $('#btnCopyLink').addEventListener('click', async () => {
            const ok = await EBOOK_SHARE.copyLink();
            $('#btnCopyLink').textContent = ok ? '✓ কপি হয়েছে' : '✗ ব্যর্থ';
            setTimeout(() => $('#btnCopyLink').textContent = 'কপি', 1500);
            if (ok && window.EBOOK_ANALYTICS) {
                EBOOK_ANALYTICS.shareClick('copy', state.currentChapter);
                EBOOK_ANALYTICS.shareComplete('copy');
            }
        });

        // Hero buttons
        $('#btnHeroStart').addEventListener('click', () => {
            document.getElementById('ch1')?.scrollIntoView({ behavior: 'smooth' });
            closeToc();
        });
        $('#btnHeroListen').addEventListener('click', () => {
            startChapterAudio('ch1');
            document.getElementById('ch1')?.scrollIntoView({ behavior: 'smooth' });
        });
        $('#btnHeroShare').addEventListener('click', () => openShare(null));
        $('#btnStartReading').addEventListener('click', () => {
            closeToc();
            document.getElementById('ch1')?.scrollIntoView({ behavior: 'smooth' });
        });

        // Companion web app links (hero + book-end)
        ['btnHeroApp', 'btnEndApp'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => {
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('handbook_app_click', { source: id });
            });
        });

        // Author links: other ebooks + portfolio (About section + book-end)
        document.addEventListener('click', (e) => {
            const chip = e.target.closest('.author-chip');
            if (chip && window.EBOOK_ANALYTICS) {
                EBOOK_ANALYTICS.event('author_link_click', { link_id: chip.dataset.authorLink || 'unknown' });
            }
        });

        // Official fertilizer recommendation card (FRS-BD) — About section + book-end
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.official-card');
            if (card && window.EBOOK_ANALYTICS) {
                const source = card.closest('.book-end') ? 'book_end' : 'about';
                EBOOK_ANALYTICS.event('frs_bd_click', { source });
            }
        });

        // ── PWA install buttons (topbar + hero + book-end) ────────
        // Shown only when the browser allows install: on
        // beforeinstallprompt (Android/desktop Chrome/Edge) or on
        // iOS Safari, where a manual guide is offered instead.
        const INSTALL_BTNS = ['btnInstallTop', 'btnHeroInstall', 'btnEndInstall'];
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        let installEvt = null;

        const showInstallUI = () => document.body.classList.add('install-ready');
        const hideInstallUI = () => document.body.classList.remove('install-ready');

        if (!isStandalone) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                installEvt = e;
                showInstallUI();
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('pwa_install_available', {});
            });
            if (isIOS) showInstallUI();  // iOS never fires beforeinstallprompt
        }

        window.addEventListener('appinstalled', () => {
            installEvt = null;
            hideInstallUI();
            if (window.EBOOK_TOAST) EBOOK_TOAST('📖 ইনস্টল সম্পন্ন — এখন হোম স্ক্রিন থেকে অফলাইনেও পড়া যাবে!');
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('pwa_installed', {});
        });

        INSTALL_BTNS.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', async () => {
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('pwa_install_click', { source: id });
                if (!installEvt) {
                    if (window.EBOOK_TOAST) EBOOK_TOAST(isIOS
                        ? '📲 শেয়ার (⬆️) বোতামে চাপ দিয়ে "হোম স্ক্রিনে যোগ করুন" নির্বাচন করুন'
                        : 'এই ব্রাউজারে সরাসরি ইনস্টল নেই — Chrome/Edge-এ খুলে মেনুর "Install app" চাপুন');
                    return;
                }
                installEvt.prompt();
                const { outcome } = await installEvt.userChoice;
                installEvt = null;
                if (outcome === 'accepted') hideInstallUI();
            });
        });
        window.EBOOK_INSTALL = { hasPrompt: () => !!installEvt, isStandalone: isStandalone };

        // Slides: thumbnails open the lightbox; PDF link tracked
        document.addEventListener('click', (e) => {
            const thumb = e.target.closest('.slide-thumb');
            if (thumb) { openSlideViewer(parseInt(thumb.dataset.slide, 10)); return; }
            const pdf = e.target.closest('[data-slides-pdf]');
            if (pdf && window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('slides_pdf_click', {});
        });

        // End buttons
        $('#btnEndShare').addEventListener('click', () => openShare(null));
        $('#btnEndRestart').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Settings: theme
        $$('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newTheme = btn.dataset.theme;
                const changed = newTheme !== state.settings.theme;
                state.settings.theme = newTheme;
                localStorage.setItem('ebook-theme', state.settings.theme);
                applySettings();
                if (changed && window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.themeChange(newTheme);
            });
        });
        // Settings: font
        $$('.font-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newFont = btn.dataset.font;
                const changed = newFont !== state.settings.font;
                state.settings.font = newFont;
                localStorage.setItem('ebook-font', state.settings.font);
                applySettings();
                if (changed && window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.fontChange(newFont);
            });
        });
        // Settings: font size
        let fontSizeDebounce;
        $('#fontSizeRange').addEventListener('input', (e) => {
            state.settings.fontSize = parseInt(e.target.value, 10);
            localStorage.setItem('ebook-fontsize', state.settings.fontSize);
            applySettings();
            // Debounce analytics to avoid spamming while dragging
            clearTimeout(fontSizeDebounce);
            fontSizeDebounce = setTimeout(() => {
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.fontSizeChange(state.settings.fontSize);
            }, 800);
        });
        $('#btnFontInc').addEventListener('click', () => {
            state.settings.fontSize = Math.min(24, state.settings.fontSize + 1);
            localStorage.setItem('ebook-fontsize', state.settings.fontSize);
            applySettings();
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.fontSizeChange(state.settings.fontSize);
        });
        $('#btnFontDec').addEventListener('click', () => {
            state.settings.fontSize = Math.max(14, state.settings.fontSize - 1);
            localStorage.setItem('ebook-fontsize', state.settings.fontSize);
            applySettings();
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.fontSizeChange(state.settings.fontSize);
        });
        // Settings: line height
        let lineHtDebounce;
        $('#lineHeightRange').addEventListener('input', (e) => {
            state.settings.lineHeight = parseInt(e.target.value, 10) / 100;
            localStorage.setItem('ebook-lineheight', e.target.value);
            applySettings();
            clearTimeout(lineHtDebounce);
            lineHtDebounce = setTimeout(() => {
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.lineHeightChange(state.settings.lineHeight);
            }, 800);
        });

        // TOC item clicks (smooth scroll + close sidebar + expand target)
        document.addEventListener('click', (e) => {
            const tocItem = e.target.closest('.toc-item');
            if (tocItem) {
                e.preventDefault();
                const target = tocItem.dataset.target;
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.tocNavigate(target);
                setTimeout(() => gotoChapter(target), 200);
            }
        });

        // Track external link clicks (in Resources / About sections)
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="http"]');
            if (a && a.href && !a.href.includes('moniruzjaman.github.io')) {
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.externalLink(a.href);
            }
        });

        // Action plan: toggle check + persist
        document.addEventListener('click', (e) => {
            const checkCell = e.target.closest('.action-row .check');
            if (!checkCell) return;
            checkCell.classList.toggle('done');
            const done = $$('.action-row')
                .map((r, i) => r.querySelector('.check')?.classList.contains('done') ? i : -1)
                .filter(i => i >= 0);
            localStorage.setItem('ebook-actionplan', JSON.stringify(done));
            const day = checkCell.closest('.action-row')?.querySelector('.day')?.textContent || 'unknown';
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.actionPlanCheck(day);
        });

        // Quiz: reveal correct answer + explanation on first choice
        document.addEventListener('click', (e) => {
            const opt = e.target.closest('.quiz-options li');
            if (!opt) return;
            const question = opt.closest('.quiz-question');
            if (!question || question.classList.contains('answered')) return;
            question.classList.add('answered');
            const correct = parseInt(question.dataset.correct, 10);
            const options = $$('.quiz-options li', question);
            const chosen = options.indexOf(opt);
            question.dataset.chosen = String(chosen);
            options.forEach((li, i) => {
                if (i === correct) li.classList.add('correct');
                if (i === chosen && chosen !== correct) li.classList.add('wrong');
            });
            question.querySelector('.quiz-explain')?.classList.add('show');
            const qNum = question.querySelector('.qlabel')?.textContent?.match(/\d+/)?.[0] || '0';
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.quizAttempt(qNum, opt.textContent.trim().slice(0, 80));
            const answers = JSON.parse(localStorage.getItem('ebook-quiz') || '[]');
            answers[$$('.quiz-question').indexOf(question)] = chosen;
            localStorage.setItem('ebook-quiz', JSON.stringify(answers));
            updateQuizScore();
        });

        // Collapsible chapters: header click toggle
        document.addEventListener('click', (e) => {
            const toggle = e.target.closest('.chapter-toggle');
            if (toggle) toggleChapter(toggle);
        });

        // TOC footer: expand / collapse all sections
        $('#tocExpandAll').addEventListener('click', () => {
            expandAllChapters();
            closeToc();
        });
        $('#tocCollapseAll').addEventListener('click', () => {
            collapseAllChapters();
            closeToc();
        });

        // Scroll
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore when typing in inputs (target may be document/window for synthetic events)
            if (e.target instanceof Element && e.target.matches('input, textarea, select')) return;
            switch (e.key) {
                case 'Escape':
                    if ($('#shareModal').classList.contains('visible')) closeShare();
                    else if ($('#searchModal').classList.contains('visible')) closeSearch();
                    else if ($('#notesModal').classList.contains('visible')) closeNotes();
                    else if ($('#tocSidebar').classList.contains('open')) closeToc();
                    else if ($('#settingsPanel').classList.contains('open')) closeSettings();
                    hideHlToolbar();
                    break;
                case '/':
                    e.preventDefault();
                    openSearch();
                    break;
                case 'b':
                case 'B':
                    toggleBookmark();
                    break;
                case '?':
                    if (!$('#settingsPanel').classList.contains('open')) openSettings();
                    break;
                case 'm':
                case 'M':
                    if (!$('#tocSidebar').classList.contains('open')) openToc();
                    else closeToc();
                    break;
                case 's':
                case 'S':
                    if (!$('#settingsPanel').classList.contains('open')) openSettings();
                    else closeSettings();
                    break;
                case 't':
                case 'T':
                    if (state.currentChapter && state.currentChapter !== 'hero') {
                        startChapterAudio(state.currentChapter);
                    }
                    break;
                case 'ArrowLeft':
                    if (!e.altKey && !e.ctrlKey && !e.metaKey) gotoChapterNav(-1);
                    break;
                case 'ArrowRight':
                    if (!e.altKey && !e.ctrlKey && !e.metaKey) gotoChapterNav(1);
                    break;
                case 'Enter':
                case ' ':
                    if (e.target.classList && e.target.classList.contains('chapter-toggle')) {
                        e.preventDefault();
                        toggleChapter(e.target);
                    }
                    break;
            }
        });
    }

    // ── Search (findability) ───────────────────────────────────
    function stripHtml(html) {
        const d = document.createElement('div');
        d.innerHTML = html;
        return (d.textContent || '').replace(/\s+/g, ' ').normalize('NFD');
    }
    const SEARCH_INDEX = EBOOK_CONTENT.chapters.map((ch) => ({
        id: ch.id,
        num: ch.numLabel,
        title: ch.title,
        head: ch.subtitle || '',
        text: stripHtml(ch.html),
    }));
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let lastSearchResults = [];

    function runSearch(q) {
        q = (q || '').trim().normalize('NFD'); // match PDF-extracted text (decomposed nukta)
        const meta = $('#searchMeta');
        const box = $('#searchResults');
        if (q.length < 2) {
            meta.textContent = 'কমপক্ষে ২ অক্ষর লিখুন — ৩৬টি অধ্যায় ও ১৫০+ সারণির সম্পূর্ণ পাঠ্যে অনুসন্ধান';
            box.innerHTML = '';
            lastSearchResults = [];
            return;
        }
        const lq = q.toLowerCase();
        const hits = [];
        for (const ch of SEARCH_INDEX) {
            const inTitle = ch.title.toLowerCase().includes(lq) || ch.num.toLowerCase().includes(lq);
            const inHead = ch.head.toLowerCase().includes(lq);
            const idx = ch.text.toLowerCase().indexOf(lq);
            if (!inTitle && !inHead && idx === -1) continue;
            let snippet = '';
            if (idx !== -1) {
                const s = Math.max(0, idx - 60);
                snippet = (s > 0 ? '…' : '') + ch.text.slice(s, idx + q.length + 80) + '…';
            } else {
                snippet = ch.head || ch.title;
            }
            hits.push({ ch, inTitle: inTitle || inHead, snippet, lq });
        }
        hits.sort((a, b) => (b.inTitle - a.inTitle));
        lastSearchResults = hits.slice(0, 30);
        const chCount = new Set(lastSearchResults.map(h => h.ch.id)).size;
        meta.textContent = hits.length
            ? `${bnNum(hits.length)}টি ফলাফল · ${bnNum(chCount)}টি অধ্যায়ে`
            : 'কোনো ফলাফল নেই — বানান বদলে দেখুন';
        const markQ = (txt) => esc(txt).split(esc(q)).join('<mark>' + esc(q) + '</mark>');
        box.innerHTML = lastSearchResults.map((h, i) => `
<button class="search-hit" type="button" data-idx="${i}">
  <span class="search-hit-num">${esc(h.ch.num)}</span>
  <span class="search-hit-body">
    <span class="search-hit-title">${markQ(h.ch.title)}</span>
    <span class="search-hit-snippet">${markQ(h.snippet)}</span>
  </span>
</button>`).join('');
        if (hits.length && window.EBOOK_ANALYTICS) {
            EBOOK_ANALYTICS.event('search_run', { term_len: q.length, results: hits.length });
        }
    }

    function scrollToMatch(id, q) {
        const el = document.getElementById(id);
        if (!el || !q || q.length < 2) return;
        const lq = q.toLowerCase().normalize('NFD');
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (!node.nodeValue.toLowerCase().normalize('NFD').includes(lq)) continue;
            // Flash the whole text node — index mapping across NFC/NFD is unsafe
            const r = document.createRange();
            r.selectNodeContents(node);
            const span = document.createElement('span');
            span.className = 'search-flash';
            try { r.surroundContents(span); } catch (e) { /* skip flash */ }
            span.scrollIntoView({ block: 'center' });
            setTimeout(() => {
                const p = span.parentNode;
                if (p) {
                    while (span.firstChild) p.insertBefore(span.firstChild, span);
                    span.remove();
                    p.normalize();
                }
            }, 2200);
            return;
        }
    }

    function openSearch() {
        $('#searchModal').classList.add('visible');
        closeToc();
        setTimeout(() => $('#searchInput').focus(), 60);
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('search_open', {});
    }
    function closeSearch() {
        $('#searchModal')?.classList.remove('visible');
    }

    // ── Bookmarks (findability) ────────────────────────────────
    function getBookmarks() {
        try { return JSON.parse(localStorage.getItem('ebook-bookmarks') || '[]'); }
        catch (e) { return []; }
    }
    function isBookmarked(id) { return getBookmarks().includes(id); }
    function toggleBookmark() {
        const id = state.currentChapter;
        if (!id || id === 'hero') return;
        const list = getBookmarks();
        const i = list.indexOf(id);
        if (i >= 0) {
            list.splice(i, 1);
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('bookmark_remove', { chapter_id: id });
        } else {
            list.unshift(id);
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('bookmark_add', { chapter_id: id });
        }
        try { localStorage.setItem('ebook-bookmarks', JSON.stringify(list.slice(0, 30))); } catch (e) {}
        renderBookmarks();
        updateBookmarkBtn();
    }
    function updateBookmarkBtn() {
        const btn = $('#btnBookmark');
        if (!btn) return;
        const id = state.currentChapter;
        btn.classList.toggle('active', !!id && id !== 'hero' && isBookmarked(id));
        btn.disabled = !id || id === 'hero';
    }
    function renderBookmarks() {
        const box = $('#tocBookmarks');
        if (!box) return;
        const list = getBookmarks().filter((id) => document.getElementById(id));
        if (!list.length) {
            box.innerHTML = '<div class="toc-bookmarks-empty">বুকমার্ক নেই — পড়ার সময় <kbd>B</kbd> বা উপরের 🔖 বোতামে অধ্যায় সংরক্ষণ করুন</div>';
            return;
        }
        box.innerHTML = '<div class="toc-section-header">বুকমার্ক করা অধ্যায়</div>' + list.map((id) => {
            const sec = document.getElementById(id);
            const ch = SEARCH_INDEX.find(c => c.id === id);
            const num = sec?.dataset?.num || ch?.num || '';
            const title = sec?.querySelector('.chapter-title')?.textContent || ch?.title || id;
            return `
<div class="toc-bookmark-row">
  <a href="#${id}" class="toc-item toc-item-bm" data-target="${id}">
    <span class="toc-num">🔖</span>
    <span class="toc-text-block"><span class="toc-item-title">${esc(num)} ${esc(title)}</span></span>
  </a>
  <button class="toc-bm-del" type="button" data-bm-del="${id}" aria-label="বুকমার্ক মুছুন">✕</button>
</div>`;
        }).join('');
    }

    // ── Resume last chapter (findability) ──────────────────────
    function initResume() {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem('ebook-last')); } catch (e) {}
        if (!saved || !saved.id || !document.getElementById(saved.id)) return;
        if (window.location.hash) return; // deep link — respect the explicit target
        if (saved.id === 'ch1') return;   // first chapter — nothing to resume
        $('#resumeLabel').textContent = (saved.num ? saved.num + ' · ' : '') + saved.title;
        const toast = $('#resumeToast');
        setTimeout(() => toast.classList.add('visible'), 1200);
        clearTimeout(initResume._t);
        initResume._t = setTimeout(() => toast.classList.remove('visible'), 18000);
    }

    // ── Table filters (field use) ──────────────────────────────
    function enhanceTables() {
        let n = 0;
        $$('.frg-table').forEach((tbl) => {
            const rows = Array.from(tbl.querySelectorAll('tbody tr'));
            if (rows.length < 8) return;
            n++;
            const wrap = document.createElement('div');
            wrap.className = 'tbl-filter';
            wrap.innerHTML = `
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
<input type="text" class="tbl-filter-input" placeholder="এই সারণিতে খুঁজুন…" aria-label="সারণির সারি ফিল্টার করুন">
<span class="tbl-filter-count"></span>`;
            tbl.parentNode.insertBefore(wrap, tbl);
            const input = wrap.querySelector('input');
            const countEl = wrap.querySelector('.tbl-filter-count');
            let reported = false;
            input.addEventListener('input', () => {
                const q = input.value.trim().toLowerCase().normalize('NFD');
                let shown = 0;
                rows.forEach((tr) => {
                    const hit = !q || tr.textContent.toLowerCase().normalize('NFD').includes(q);
                    tr.style.display = hit ? '' : 'none';
                    if (hit) shown++;
                });
                countEl.textContent = q ? `${bnNum(shown)}/${bnNum(rows.length)}` : '';
                tbl.classList.toggle('tbl-filtering', !!q);
                if (!reported && q.length >= 2 && window.EBOOK_ANALYTICS) {
                    reported = true;
                    EBOOK_ANALYTICS.event('table_filter_use', { rows: rows.length });
                }
            });
        });
        if (n) console.log(`সারণি ফিল্টার যোগ হয়েছে: ${n}টি`);
    }

    // ── Highlights & notes (reading UX) ────────────────────────
    const HL_KEY = 'ebook-highlights';
    function getHighlights() {
        try { return JSON.parse(localStorage.getItem(HL_KEY) || '[]'); }
        catch (e) { return []; }
    }
    function setHighlights(list) {
        try { localStorage.setItem(HL_KEY, JSON.stringify(list.slice(0, 200))); } catch (e) {}
    }
    function paraCoords(para) {
        const body = para.closest('.chapter-body');
        if (!body || !body.id) return null;
        const paras = Array.from(body.querySelectorAll('p'));
        return { ch: body.id.replace(/-body$/, ''), pi: paras.indexOf(para) };
    }
    function applyMark(para, hl) {
        const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
        let node, occ = 0;
        while ((node = walker.nextNode())) {
            let idx = node.nodeValue.indexOf(hl.text);
            while (idx !== -1) {
                if (occ === (hl.occ || 0)) {
                    const mark = document.createElement('mark');
                    mark.className = 'hl hl-' + (hl.color || 'y');
                    if (hl.note) mark.title = hl.note;
                    mark.dataset.hlKey = hl.k;
                    const r = document.createRange();
                    r.setStart(node, idx);
                    r.setEnd(node, Math.min(node.nodeValue.length, idx + hl.text.length));
                    try { r.surroundContents(mark); return true; } catch (e) { return false; }
                }
                occ++;
                idx = node.nodeValue.indexOf(hl.text, idx + 1);
            }
        }
        return false;
    }
    function applySavedHighlights() {
        getHighlights().forEach((hl) => {
            const body = document.getElementById(hl.ch + '-body');
            const para = body && body.querySelectorAll('p')[hl.pi];
            if (para) applyMark(para, hl);
        });
    }
    let selState = null;
    let activeMark = null;
    function hideHlToolbar() {
        $('#hlToolbar')?.classList.remove('visible');
        selState = null;
        activeMark = null;
    }
    function computeOcc(para, range) {
        const pre = document.createRange();
        pre.selectNodeContents(para);
        pre.setEnd(range.startContainer, range.startOffset);
        const prefix = pre.toString();
        return prefix.split(selState.text).length - 1;
    }
    function positionToolbar(x, y) {
        const tb = $('#hlToolbar');
        tb.style.left = Math.max(10, Math.min(window.innerWidth - tb.offsetWidth - 10, x)) + 'px';
        tb.style.top = Math.max(58, Math.min(window.innerHeight - 60, y)) + 'px';
        tb.classList.add('visible');
    }
    function onSelectionChange() {
        if (activeMark) return; // mark-click mode
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { hideHlToolbar(); return; }
        const range = sel.getRangeAt(0);
        const anc = range.commonAncestorContainer.nodeType === 3
            ? range.commonAncestorContainer.parentElement
            : range.commonAncestorContainer;
        const para = anc?.closest?.('.chapter-body p');
        if (!para) { hideHlToolbar(); return; }
        if (range.startContainer !== range.endContainer) { hideHlToolbar(); return; }
        const text = sel.toString().replace(/\s+/g, ' ').trim();
        if (!text || text.length < 2) { hideHlToolbar(); return; }
        selState = { para, text };
        selState.occ = computeOcc(para, range);
        const r = range.getBoundingClientRect();
        const tb = $('#hlToolbar');
        positionToolbar(r.left + r.width / 2 - tb.offsetWidth / 2, r.top - tb.offsetHeight - 10);
    }
    function addHighlight(color, note) {
        if (!selState) return;
        const { para, text, occ } = selState;
        const coords = paraCoords(para);
        if (!coords || coords.pi < 0) return;
        const k = coords.ch + '|' + coords.pi + '|' + occ + '|' + text.slice(0, 32);
        const list = getHighlights().filter((h) => h.k !== k);
        const hl = { k, ch: coords.ch, pi: coords.pi, text, occ, color, note: note || '', ts: Date.now() };
        list.push(hl);
        setHighlights(list);
        applyMark(para, hl);
        window.getSelection().removeAllRanges();
        hideHlToolbar();
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event(note ? 'note_add' : 'highlight_add', {});
        renderNotesModal();
    }
    function removeHighlightByKey(k) {
        setHighlights(getHighlights().filter((h) => h.k !== k));
        const mark = $(`mark[data-hl-key="${CSS.escape(k)}"]`);
        if (mark) {
            const frag = document.createDocumentFragment();
            while (mark.firstChild) frag.appendChild(mark.firstChild);
            mark.replaceWith(frag);
            mark.parentElement?.normalize();
        }
        renderNotesModal();
        hideHlToolbar();
    }

    function renderNotesModal() {
        const body = $('#notesBody');
        if (!body) return;
        const list = getHighlights();
        if (!list.length) {
            body.innerHTML = '<div class="notes-empty">এখনো কোনো হাইলাইট বা নোট নেই।<br>পড়ার সময় যেকোনো লাইন সিলেক্ট করে হাইলাইট বা নোট যোগ করুন — পরে এখানে জমা থাকবে।</div>';
            return;
        }
        const byCh = {};
        list.forEach((h) => { (byCh[h.ch] = byCh[h.ch] || []).push(h); });
        body.innerHTML = Object.keys(byCh).map((cid) => {
            const cd = SEARCH_INDEX.find(c => c.id === cid);
            const label = cd ? `${cd.num} · ${cd.title}` : cid;
            return `<div class="notes-group"><div class="notes-group-title">${esc(label)}</div>` +
                byCh[cid].map((h) => `
<div class="notes-item">
  <span class="notes-dot hl-${h.color || 'y'}"></span>
  <div class="notes-item-body">
    <div class="notes-item-text">${esc(h.text)}</div>
    ${h.note ? `<div class="notes-item-note">${esc(h.note)}</div>` : ''}
  </div>
  <div class="notes-item-actions">
    <button class="toc-mini-btn" type="button" data-notes-jump="${h.ch}">যান</button>
    <button class="toc-mini-btn" type="button" data-notes-del="${esc(h.k)}">মুছুন</button>
  </div>
</div>`).join('') + '</div>';
        }).join('');
    }
    function openNotes() {
        renderNotesModal();
        $('#notesModal').classList.add('visible');
        closeToc();
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('notes_open', { count: getHighlights().length });
    }
    function closeNotes() {
        $('#notesModal')?.classList.remove('visible');
    }

    // ── Feature event wiring ───────────────────────────────────
    function wireFeatureEvents() {
        // Search
        $('#btnSearch').addEventListener('click', openSearch);
        $('#btnCloseSearch').addEventListener('click', closeSearch);
        $('#searchModal').addEventListener('click', (e) => {
            if (e.target.id === 'searchModal') closeSearch();
        });
        $('#btnSearchClear').addEventListener('click', () => {
            $('#searchInput').value = '';
            runSearch('');
            $('#searchInput').focus();
        });
        let searchDeb;
        $('#searchInput').addEventListener('input', (e) => {
            clearTimeout(searchDeb);
            searchDeb = setTimeout(() => runSearch(e.target.value), 160);
        });
        $('#searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = $('#searchResults .search-hit');
                if (first) first.click();
            }
        });
        $('#searchResults').addEventListener('click', (e) => {
            const hit = e.target.closest('.search-hit');
            if (!hit) return;
            const h = lastSearchResults[parseInt(hit.dataset.idx, 10)];
            if (!h) return;
            closeSearch();
            gotoChapter(h.ch.id);
            setTimeout(() => scrollToMatch(h.ch.id, h.lq ? (hit.querySelector('.search-hit-snippet mark')?.textContent || $('#searchInput').value.trim()) : $('#searchInput').value.trim()), 500);
        });

        // Bookmarks
        $('#btnBookmark').addEventListener('click', toggleBookmark);
        document.addEventListener('click', (e) => {
            const del = e.target.closest('[data-bm-del]');
            if (del) {
                e.preventDefault();
                e.stopPropagation();
                const list = getBookmarks().filter((id) => id !== del.dataset.bmDel);
                try { localStorage.setItem('ebook-bookmarks', JSON.stringify(list)); } catch (err) {}
                renderBookmarks();
                updateBookmarkBtn();
                if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('bookmark_remove', { chapter_id: del.dataset.bmDel });
            }
        });

        // Resume toast
        $('#btnResumeGo').addEventListener('click', () => {
            try {
                const saved = JSON.parse(localStorage.getItem('ebook-last'));
                if (saved) gotoChapter(saved.id);
            } catch (e) {}
            $('#resumeToast').classList.remove('visible');
            if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('resume_click', {});
        });
        $('#btnResumeDismiss').addEventListener('click', () => $('#resumeToast').classList.remove('visible'));

        // Highlights & notes
        document.addEventListener('selectionchange', () => setTimeout(onSelectionChange, 10));
        window.addEventListener('scroll', () => {
            if (!$('#hlToolbar').classList.contains('visible')) return;
            // keep the toolbar anchored to a live selection
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) hideHlToolbar();
        }, { passive: true });
        const tb = $('#hlToolbar');
        tb.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
        tb.addEventListener('click', (e) => {
            const btn = e.target.closest('.hl-btn');
            if (!btn) return;
            if (btn.dataset.hlColor) {
                if (activeMark) restyleActiveMark(btn.dataset.hlColor);
                else addHighlight(btn.dataset.hlColor, null);
            } else if (btn.dataset.hlNote) {
                const existing = activeMark ? getHighlights().find((h) => h.k === activeMark.dataset.hlKey) : null;
                const note = window.prompt('নোট লিখুন (হাইলাইটের সাথে সংরক্ষিত হবে):', existing?.note || '');
                if (note === null) return;
                if (activeMark) addNoteToActiveMark(note);
                else addHighlight('y', note);
            } else if (btn.dataset.hlDel) {
                if (activeMark?.dataset.hlKey) removeHighlightByKey(activeMark.dataset.hlKey);
                else if (selState) {
                    // delete any highlight fully inside the selection
                    const sel = window.getSelection();
                    const text = selState.text;
                    const inSel = getHighlights().filter((h) => h.ch === paraCoords(selState.para)?.ch && h.pi === paraCoords(selState.para)?.pi && h.text === text);
                    if (inSel.length) { removeHighlightByKey(inSel[0].k); }
                    else { window.getSelection()?.removeAllRanges?.(); hideHlToolbar(); }
                }
            }
        });
        // Clicking an existing highlight selects it for restyle/note/delete
        document.addEventListener('click', (e) => {
            const mark = e.target.closest('mark.hl');
            if (!mark) return;
            e.preventDefault();
            activeMark = mark;
            selState = null;
            const r = mark.getBoundingClientRect();
            positionToolbar(r.left + r.width / 2 - tb.offsetWidth / 2, r.top - tb.offsetHeight - 10);
        });

        // Notes modal
        $('#btnNotesToc').addEventListener('click', openNotes);
        $('#btnCloseNotes').addEventListener('click', closeNotes);
        $('#notesModal').addEventListener('click', (e) => {
            if (e.target.id === 'notesModal') closeNotes();
        });
        $('#notesBody').addEventListener('click', (e) => {
            const jump = e.target.closest('[data-notes-jump]');
            if (jump) { closeNotes(); gotoChapter(jump.dataset.notesJump); return; }
            const del = e.target.closest('[data-notes-del]');
            if (del) removeHighlightByKey(del.dataset.notesDel);
        });
        $('#btnNotesExport').addEventListener('click', async () => {
            const list = getHighlights();
            if (!list.length) return;
            const lines = list.map((h) => {
                const cd = SEARCH_INDEX.find(c => c.id === h.ch);
                return `【${cd ? cd.num + ' · ' + cd.title : h.ch}】 ${h.text}${h.note ? '\n  নোট: ' + h.note : ''}`;
            });
            const text = 'সার সুপারিশমালা হ্যান্ডবই-২০২৪ — আমার হাইলাইট ও নোট\n\n' + lines.join('\n\n');
            try {
                await navigator.clipboard.writeText(text);
                $('#btnNotesExport').textContent = '✓ কপি হয়েছে';
            } catch (err) {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                $('#btnNotesExport').textContent = '✓ কপি হয়েছে';
            }
            setTimeout(() => { $('#btnNotesExport').textContent = 'কপি করুন'; }, 1600);
        });
    }
    function restyleActiveMark(color) {
        const k = activeMark.dataset.hlKey;
        const list = getHighlights().map((h) => h.k === k ? { ...h, color } : h);
        setHighlights(list);
        activeMark.className = 'hl hl-' + color;
        hideHlToolbar();
    }
    function addNoteToActiveMark(note) {
        const k = activeMark.dataset.hlKey;
        const list = getHighlights().map((h) => h.k === k ? { ...h, note, color: h.color || 'o' } : h);
        setHighlights(list);
        activeMark.title = note;
        activeMark.classList.add('hl-' + (list.find((h) => h.k === k).color || 'o'));
        hideHlToolbar();
        if (window.EBOOK_ANALYTICS) EBOOK_ANALYTICS.event('note_add', {});
    }

    // ── Init ───────────────────────────────────────────────────
    function init() {
        renderBook();
        // Slides appendix entry (rendered by renderSlidesSection above)
        EBOOK_TOC.push({ id: 'slides', num: 'স্লাইড', title: 'ভিজ্যুয়াল হ্যান্ডবুক স্লাইড', sub: `${bnNum(SLIDE_COUNT)} স্লাইডে ভিজ্যুয়াল উপস্থাপনা` });
        renderToc();
        applySettings();
        wireEvents();
        wireFeatureEvents();
        applySavedHighlights();
        enhanceTables();
        renderBookmarks();
        updateBookmarkBtn();
        initResume();
        restoreInteractivity();
        onScroll();

        // Open chapter from URL hash (auto-expands collapsed sections)
        const hash = window.location.hash.slice(1);
        if (hash) {
            setTimeout(() => gotoChapter(hash), 400);
        }

        // Pre-warm TTS voices
        if (window.EBOOK_TTS) EBOOK_TTS.init();

        console.log('%c📖 সার সুপারিশমালা হ্যান্ডবই-২০২৪ — ই-বুক পাঠক', 'color:#2C6C3C;font-weight:bold;font-size:14px');
        console.log('Shortcuts: /=অনুসন্ধান · M=সূচিপত্র · B=বুকমার্ক · T=শুনুন · ←/→=অধ্যায় · S=সেটিংস · Esc=বন্ধ');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
