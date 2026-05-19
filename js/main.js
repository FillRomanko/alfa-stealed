(function(window, document) {
    'use strict';

    class DataFetcher {
        constructor(basePath = 'data') {
            this.base = basePath;
            this.cache = new Map();
        }

        async get(filename) {
            if (this.cache.has(filename)) return this.cache.get(filename);
            const url = `${this.base}/${filename}.json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.cache.set(filename, data);
            return data;
        }
    }

    class MenuController {
        constructor(fetcher, selectors) {
            this.fetcher = fetcher;
            this.selectors = selectors;
            this.menuData = null;
            this.activeMobileCat = 'private-clients';
            this.hideTimer = null;
            this.init();
        }

        async init() {
            this.menuData = await this.fetcher.get('header');
            this.renderDesktopNav();
            this.initMegaMenu();
            this.buildMobileNav();
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
        }

        renderDesktopNav() {
            const container = document.querySelector(this.selectors.navLinks);
            if (!container) return;
            const items = this.menuData.menuMobile || [];
            container.innerHTML = items.map(item => `
                <li>
                    <a href="#" data-navkey="${item.key}">${this.escape(item.label)}</a>
                </li>
            `).join('');
        }

        initMegaMenu() {
            const navLinks = document.querySelectorAll(`${this.selectors.navLinks} a`);
            const mega = document.querySelector(this.selectors.megaMenu);
            const overlay = document.querySelector(this.selectors.overlay);
            const titlesBox = document.querySelector(this.selectors.megaTitles);
            const contentBox = document.querySelector(this.selectors.megaContent);

            if (!mega || !overlay) return;

            const showPanel = (key) => {
                if (this.hideTimer) clearTimeout(this.hideTimer);
                const sections = this.menuData[key];
                if (!sections?.length) return;
                titlesBox.innerHTML = '';
                contentBox.innerHTML = '';
                sections.forEach((sec, idx) => {
                    const link = document.createElement('a');
                    link.textContent = sec.title;
                    link.dataset.idx = idx;
                    titlesBox.appendChild(link);
                });
                this.renderMegaContent(sections[0], contentBox);
                titlesBox.querySelectorAll('a').forEach(link => {
                    link.addEventListener('mouseenter', (e) => {
                        const idx = parseInt(e.target.dataset.idx);
                        if (sections[idx]) this.renderMegaContent(sections[idx], contentBox);
                    });
                });
                mega.classList.add('active');
                overlay.classList.add('active');
            };

            const hidePanel = () => {
                this.hideTimer = setTimeout(() => {
                    mega.classList.remove('active');
                    overlay.classList.remove('active');
                }, 150);
            };

            navLinks.forEach(link => {
                link.addEventListener('mouseenter', () => showPanel(link.dataset.navkey));
                link.addEventListener('mouseleave', hidePanel);
            });
            mega.addEventListener('mouseenter', () => clearTimeout(this.hideTimer));
            mega.addEventListener('mouseleave', hidePanel);
            overlay.addEventListener('click', hidePanel);
        }

        renderMegaContent(section, container) {
            container.innerHTML = '';
            if (!section.sections) return;
            section.sections.forEach(sub => {
                const div = document.createElement('div');
                div.className = 'mega-subsection';
                div.innerHTML = `<h4>${this.escape(sub.title)}</h4>`;
                if (sub.links) {
                    sub.links.forEach(link => {
                        div.innerHTML += `<a href="${link.href}">${this.escape(link.label)}</a>`;
                    });
                }
                container.appendChild(div);
            });
        }

        buildMobileNav() {
            const switchBox = document.querySelector(this.selectors.mobileSwitch);
            const accordionBox = document.querySelector(this.selectors.mobileAccordion);
            if (!switchBox || !accordionBox) return;

            const menuItems = this.menuData.menuMobile || [];
            switchBox.innerHTML = '';
            menuItems.forEach(item => {
                const btn = document.createElement('button');
                btn.textContent = item.label;
                btn.dataset.cat = item.key;
                if (item.key === this.activeMobileCat) btn.classList.add('active');
                btn.addEventListener('click', () => {
                    switchBox.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeMobileCat = item.key;
                    this.renderMobileAccordion(accordionBox, this.activeMobileCat);
                });
                switchBox.appendChild(btn);
            });
            this.renderMobileAccordion(accordionBox, this.activeMobileCat);
        }

        renderMobileAccordion(container, cat) {
            const sections = this.menuData[cat] || [];
            container.innerHTML = '';
            sections.forEach(sec => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'accordion-item';
                const header = document.createElement('div');
                header.className = 'accordion-header';
                header.innerHTML = `<span>${this.escape(sec.title)}</span><span>▼</span>`;
                header.addEventListener('click', () => itemDiv.classList.toggle('open'));
                const submenu = document.createElement('div');
                submenu.className = 'submenu-items';
                if (sec.sections) {
                    sec.sections.forEach(sub => {
                        submenu.innerHTML += `<div style="font-weight:600;margin-top:12px">${this.escape(sub.title)}</div>`;
                        if (sub.links) {
                            sub.links.forEach(link => {
                                submenu.innerHTML += `<a href="${link.href}" style="display:block;padding:6px 0 6px 16px;color:#aaa">${this.escape(link.label)}</a>`;
                            });
                        }
                    });
                }
                itemDiv.appendChild(header);
                itemDiv.appendChild(submenu);
                container.appendChild(itemDiv);
            });
        }

        handleResize() {
            const isMobile = window.innerWidth <= 900;
            const navBlock = document.querySelector(this.selectors.navLinks);
            const mobileBlock = document.querySelector(this.selectors.mobileBlock);
            if (!navBlock || !mobileBlock) return;
            if (isMobile) {
                navBlock.style.display = 'none';
                mobileBlock.style.display = 'block';
            } else {
                navBlock.style.display = 'flex';
                mobileBlock.style.display = 'none';
                const mega = document.querySelector(this.selectors.megaMenu);
                const overlay = document.querySelector(this.selectors.overlay);
                if (mega) mega.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            }
        }

        escape(str) {
            return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
        }
    }

    class ProductsController {
        constructor(fetcher, containerId, tabGroupSelector) {
            this.fetcher = fetcher;
            this.container = document.getElementById(containerId);
            this.tabGroup = document.querySelector(tabGroupSelector);
            this.products = [];
            this.init();
        }

        async init() {
            this.products = await this.fetcher.get('products');
            this.render('all');
            this.bindTabs();
        }

        render(category) {
            if (!this.container) return;
            const filtered = this.products.filter(p => p.categories.includes(category));
            this.container.innerHTML = filtered.map(p => `
                <div class="product-card">
                    <div class="product-card__title">${this.escape(p.title)}</div>
                    <div class="product-card__desc">${this.escape(p.desc)}</div>
                    <div class="product-card__icon">${p.svg || '📦'}</div>
                </div>
            `).join('');
        }

        bindTabs() {
            if (!this.tabGroup) return;
            const tabs = this.tabGroup.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('is-active'));
                    tab.classList.add('is-active');
                    const category = tab.dataset.tab;
                    this.render(category);
                });
            });
        }

        escape(str) {
            return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
        }
    }

    class BurgerManager {
        constructor(burgerId, navId, overlayClass = 'mobile-overlay') {
            this.burger = document.getElementById(burgerId);
            this.nav = document.getElementById(navId);
            this.overlay = null;
            this.init();
        }

        init() {
            if (!this.burger || !this.nav) return;
            this.createOverlay();
            this.burger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
            this.overlay?.addEventListener('click', () => this.closeMenu());
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closeMenu(); });
            window.addEventListener('resize', () => {
                if (window.innerWidth > 900 && this.nav.classList.contains('open')) this.closeMenu();
            });
        }

        createOverlay() {
            let ov = document.querySelector('.mobile-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.className = 'mobile-overlay';
                document.body.appendChild(ov);
            }
            this.overlay = ov;
        }

        toggleMenu() {
            this.nav.classList.contains('open') ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.nav.classList.add('open');
            this.burger.classList.add('open');
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        closeMenu() {
            this.nav.classList.remove('open');
            this.burger.classList.remove('open');
            this.overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async function startup() {
        const fetcher = new DataFetcher('data');
        const selectors = {
            navLinks: '.nav-links',
            megaMenu: '.mega-menu',
            overlay: '.overlay-bg',
            megaTitles: '[data-mega-titles]',
            megaContent: '[data-mega-content]',
            mobileSwitch: '.mobile-switch-buttons',
            mobileAccordion: '.mobile-accordion-list',
            mobileBlock: '.nav-mobile-block'
        };
        // Запускаем модули параллельно
        const menu = new MenuController(fetcher, selectors);
        const products = new ProductsController(fetcher, 'productList', '[data-tab-group="products"]');
        const burger = new BurgerManager('burgerBtn', 'navPrimary');

        await Promise.all([menu.init(), products.init()]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startup);
    } else {
        startup();
    }
})(window, document);