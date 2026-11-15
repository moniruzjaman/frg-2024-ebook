/* ============================================================
   Analytics — reader events → GTM dataLayer (GTM-MVB23SLK)
   The GTM tag is installed in <head> of index.html. Every event
   below is pushed as a GTM-native custom event, e.g.
   { event: 'chapter_read', chapter_id: 'ch1', ... }
   Tracks: page_view, chapter_read, reading_progress,
           tts_play, tts_pause, tts_complete,
           share_click, share_complete,
           quiz_attempt, action_plan_check,
           theme_change, font_change, settings_change,
           toc_open, external_link, handbook_app_click
   ============================================================ */

(function () {
    const GTM_ID = 'GTM-MVB23SLK';  // tag loaded from index.html <head>
    if (!window.dataLayer) { window.EBOOK_ANALYTICS = null; return; }

    // Fallback shim — if the head snippet is ever removed, events
    // still land in the GTM dataLayer
    if (typeof window.gtag !== 'function') {
        window.gtag = function () { window.dataLayer.push(arguments); };
    }

    // ── Event tracking helpers ─────────────────────────────────
    const EBOOK_ANALYTICS = {
        GTM_ID: GTM_ID,
        loaded: false,
        lastProgress: {},  // track last reported progress per chapter

        init() {
            if (this.loaded) return;
            this.loaded = true;
            console.log('%c📊 E-book analytics → GTM dataLayer', 'color:#1E8449;font-weight:bold', GTM_ID);
        },

        /**
         * Send event to GA4.
         * @param {string} name - event name (snake_case, ≤40 chars)
         * @param {object} params - event parameters
         */
        event(name, params = {}) {
            if (!window.dataLayer) return;
            // GTM-native custom event: { event: 'chapter_read', ...params }
            const clean = { event: name };
            for (const [k, v] of Object.entries(params)) {
                if (v == null) continue;
                if (typeof v === 'object') v = JSON.stringify(v);
                clean[k] = v;
            }
            window.dataLayer.push(clean);
        },

        // ── Specific event helpers ────────────────────────────

        chapterRead(chapterId, chapterTitle) {
            this.event('chapter_read', {
                chapter_id: chapterId,
                chapter_title: chapterTitle,
                engagement_time_msec: 100
            });
        },

        readingProgress(chapterId, percent) {
            // Report 25/50/75/100 milestones only
            const milestones = [25, 50, 75, 100];
            const last = this.lastProgress[chapterId] || 0;
            for (const m of milestones) {
                if (percent >= m && last < m) {
                    this.event('reading_progress', {
                        chapter_id: chapterId,
                        progress_percent: m
                    });
                    this.lastProgress[chapterId] = m;
                    break;
                }
            }
        },

        ttsPlay(chapterId, chapterTitle) {
            this.event('tts_play', {
                chapter_id: chapterId,
                chapter_title: chapterTitle
            });
        },

        ttsPause(chapterId) {
            this.event('tts_pause', {
                chapter_id: chapterId
            });
        },

        ttsComplete(chapterId) {
            this.event('tts_complete', {
                chapter_id: chapterId
            });
        },

        shareClick(platform, chapterId) {
            this.event('share_click', {
                platform: platform,
                chapter_id: chapterId || 'none'
            });
        },

        shareComplete(platform) {
            this.event('share_complete', {
                platform: platform
            });
        },

        quizAttempt(questionNum, answer) {
            this.event('quiz_attempt', {
                question_number: questionNum,
                answer: answer
            });
        },

        actionPlanCheck(day) {
            this.event('action_plan_check', {
                day: day
            });
        },

        themeChange(theme) {
            this.event('theme_change', {
                theme: theme
            });
        },

        fontChange(font) {
            this.event('font_change', {
                font: font
            });
        },

        fontSizeChange(size) {
            this.event('font_size_change', {
                font_size: size
            });
        },

        lineHeightChange(height) {
            this.event('line_height_change', {
                line_height: height
            });
        },

        tocOpen() {
            this.event('toc_open', {});
        },

        tocNavigate(chapterId) {
            this.event('toc_navigate', {
                chapter_id: chapterId
            });
        },

        settingsOpen() {
            this.event('settings_open', {});
        },

        shareModalOpen(chapterId) {
            this.event('share_modal_open', {
                chapter_id: chapterId || 'none'
            });
        },

        externalLink(url) {
            this.event('external_link', {
                link_url: url
            });
        },

        searchEngine() {
            // Useful to detect when site is being indexed
            this.event('site_loaded', {
                referrer: document.referrer || 'direct',
                timestamp: Date.now()
            });
        }
    };

    window.EBOOK_ANALYTICS = EBOOK_ANALYTICS;

    // Auto-init on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => EBOOK_ANALYTICS.init());
    } else {
        EBOOK_ANALYTICS.init();
    }
})();
