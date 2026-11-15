/* ============================================================
   Share module — cross-platform sharing with rich previews
   WhatsApp · Messenger · Facebook · LinkedIn · X/Twitter
   Email · Telegram · Copy link · Native Web Share API
   ============================================================ */

(function () {
    // ── Toast helper (shared with reader.js) ───────────────────
    window.EBOOK_TOAST = function (msg) {
        let t = document.getElementById('ebookToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'ebookToast';
            t.className = 'ebook-toast';
            t.setAttribute('role', 'status');
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.classList.add('show');
        clearTimeout(window.__ebookToastT);
        window.__ebookToastT = setTimeout(() => t.classList.remove('show'), 2800);
    };

    const SHARE = {
        url:   'https://moniruzjaman.github.io/frg-2024-ebook/',
        title: 'সার সুপারিশমালা হ্যান্ডবই-২০২৪ — বাংলা ই-বুক',
        text:  'বিএআরসি প্রকাশিত সর্বশেষ সার সুপারিশ নির্দেশিকা। পড়ুন, শুনুন, শেয়ার করুন।',
        hashtags: ['কৃষি', 'সার', 'FRG2024', 'বাংলা', 'agriculture', 'BARC'],

        buildUrl(platform) {
            const u = encodeURIComponent(this.url);
            const t = encodeURIComponent(this.title);
            const tx = encodeURIComponent(this.text);
            const ht = this.hashtags.join(',');
            switch (platform) {
                case 'whatsapp':
                    // WhatsApp uses text param for combined message
                    return `https://wa.me/?text=${encodeURIComponent(this.title + '\n' + this.text + '\n' + this.url)}`;
                case 'messenger':
                    // Messenger uses app_id (required) + link + redirect_uri
                    // Using Facebook's default share endpoint as fallback
                    return `https://www.facebook.com/dialog/send?app_id=145634995501895&display=popup&link=${u}&redirect_uri=${u}`;
                case 'facebook':
                    return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
                case 'linkedin':
                    return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
                case 'twitter':
                    return `https://twitter.com/intent/tweet?url=${u}&text=${encodeURIComponent(this.title + ' — ' + this.text)}&hashtags=${ht}`;
                case 'telegram':
                    return `https://t.me/share/url?url=${u}&text=${encodeURIComponent(this.title)}`;
                case 'email':
                    return `mailto:?subject=${t}&body=${encodeURIComponent(this.text + '\n\n' + this.url)}`;
                default:
                    return this.url;
            }
        },

        openPopup(url, w = 600, h = 600) {
            const left = (screen.width / 2) - (w / 2);
            const top  = (screen.height / 2) - (h / 2) - 50;
            return window.open(url, '_blank',
                `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,resizable=yes,scrollbars=yes`);
        },

        shareMessenger() {
            const isMobile = /Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
            const desktopFallback = () => {
                // No app_id-free Messenger share dialog exists for desktop —
                // copy the link and let the user paste it in Messenger
                this.copyLink().then(() => {
                    if (window.EBOOK_TOAST) window.EBOOK_TOAST('লিঙ্ক কপি হয়েছে — Messenger-এ প্রিয়জনকে পাঠিয়ে দিন');
                    this.openPopup('https://www.messenger.com/', 920, 700);
                });
            };
            if (isMobile) {
                const t0 = Date.now();
                // Try the Messenger app intent; if the app is missing, fall back
                setTimeout(() => {
                    if (!document.hidden && Date.now() - t0 < 2500) desktopFallback();
                }, 1800);
                window.location.href = 'fb-messenger://share/?link=' + encodeURIComponent(this.url);
            } else {
                desktopFallback();
            }
        },

        async copyLink() {
            try {
                await navigator.clipboard.writeText(this.url);
                return true;
            } catch (e) {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = this.url;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                let ok = false;
                try {
                    ok = document.execCommand('copy');
                } catch (_) {}
                document.body.removeChild(ta);
                return ok;
            }
        },

        async nativeShare() {
            if (!navigator.share) return false;
            try {
                await navigator.share({
                    title: this.title,
                    text: this.text,
                    url: this.url,
                    // files: [...]  // could attach og image if needed
                });
                return true;
            } catch (e) {
                if (e.name === 'AbortError') return true;
                console.warn('Native share failed:', e);
                return false;
            }
        },

        async share(platform, opts = {}) {
            // Update URL with chapter hash if specified
            if (opts.chapter) {
                this.url = `https://moniruzjaman.github.io/frg-2024-ebook/#${opts.chapter}`;
            } else {
                this.url = 'https://moniruzjaman.github.io/frg-2024-ebook/';
            }

            switch (platform) {
                case 'messenger':
                    this.shareMessenger();
                    return true;
                case 'whatsapp':
                case 'facebook':
                case 'linkedin':
                case 'twitter':
                case 'telegram':
                    this.openPopup(this.buildUrl(platform));
                    return true;
                case 'email':
                    // Email opens user's mail client — use location.href
                    window.location.href = this.buildUrl('email');
                    return true;
                case 'copy':
                    return await this.copyLink();
                case 'native':
                    return await this.nativeShare();
                default:
                    return false;
            }
        },

        isNativeSupported() {
            return !!navigator.share;
        }
    };

    window.EBOOK_SHARE = SHARE;
})();
