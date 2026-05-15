let navigationData = {};
let currentMobileCategory = 'private-clients';


async function loadNavigation() {
  const response = await fetch('data/header.json');
  navigationData = await response.json();
  buildDesktopMenu();
  initDesktopDropdown();
  buildMobileNavigation();
  toggleMobileVisibility();
  window.addEventListener('resize', toggleMobileVisibility);
}


function buildDesktopMenu() {
  const navList = document.querySelector('.nav__list');
  navList.innerHTML = '';
  const menu = navigationData.menuMobile || [];
  menu.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav__item';
    li.setAttribute('data-nav-item', item.key);
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'header__nav-link';
    link.textContent = item.label;
    const arrow = document.createElement('span');
    arrow.className = 'dropdown-arrow';
    li.appendChild(link);
    li.appendChild(arrow);
    navList.appendChild(li);
  });
}


function initDesktopDropdown() {
  const navItems = document.querySelectorAll('.nav__item');
  const dropdown = document.querySelector('.dropdown');
  const overlay = document.querySelector('.overlay');
  const titlesContainer = document.querySelector('[data-nav-titles]');
  const contentContainer = document.querySelector('[data-nav-content]');

  let activeItem = null;
  let hideTimeout = null;

  function showDropdown(item) {
    if (hideTimeout) clearTimeout(hideTimeout);
    if (activeItem === item && dropdown.classList.contains('active')) return;

    const key = item.getAttribute('data-nav-item');
    const sections = navigationData[key];
    if (!sections || sections.length === 0) {
      dropdown.classList.remove('active');
      overlay.classList.remove('active');
      activeItem = null;
      return;
    }

    titlesContainer.innerHTML = '';
    sections.forEach((section, idx) => {
      const titleLink = document.createElement('a');
      titleLink.textContent = section.title;
      titleLink.setAttribute('data-section-index', idx);
      titlesContainer.appendChild(titleLink);
    });

    renderDesktopContent(sections[0], contentContainer);

    const titles = titlesContainer.querySelectorAll('a');
    titles.forEach(title => {
      title.addEventListener('pointerenter', () => {
        const idx = title.getAttribute('data-section-index');
        if (idx && sections[idx]) renderDesktopContent(sections[idx], contentContainer);
      });
    });

    dropdown.classList.add('active');
    overlay.classList.add('active');
    activeItem = item;
  }

  function hideDropdown() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      dropdown.classList.remove('active');
      overlay.classList.remove('active');
      activeItem = null;
    }, 150);
  }

  function renderDesktopContent(section, container) {
    container.innerHTML = '';
    if (!section.sections || section.sections.length === 0) {
      container.innerHTML = '<div style="color: #fff; padding: 20px;">Нет доступных подразделов</div>';
      return;
    }
    section.sections.forEach(sub => {
      const div = document.createElement('div');
      div.className = 'subsection';
      const title = document.createElement('div');
      title.className = 'subsectionTitle';
      title.textContent = sub.title;
      div.appendChild(title);
      if (sub.links && sub.links.length) {
        sub.links.forEach(link => {
          const a = document.createElement('a');
          a.textContent = link.label;
          a.href = link.href;
          div.appendChild(a);
        });
      }
      container.appendChild(div);
    });
  }

  navItems.forEach(item => {
    item.addEventListener('pointerenter', () => showDropdown(item));
    item.addEventListener('pointerleave', hideDropdown);
  });
  dropdown.addEventListener('pointerenter', () => { if (hideTimeout) clearTimeout(hideTimeout); });
  dropdown.addEventListener('pointerleave', hideDropdown);
  overlay.addEventListener('pointerenter', hideDropdown);
}


function buildMobileNavigation() {
  const switchContainer = document.querySelector('.mobile-switch');
  const sectionsList = document.querySelector('.mobile-sections-list');
  const menuMobile = navigationData.menuMobile || [];
  switchContainer.innerHTML = '';
  menuMobile.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'mobile-switch-btn';
    if (item.key === currentMobileCategory) btn.classList.add('active');
    btn.textContent = item.label;
    btn.setAttribute('data-category', item.key);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mobile-switch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMobileCategory = item.key;
      renderMobileSectionsList(currentMobileCategory);
    });
    switchContainer.appendChild(btn);
  });
  renderMobileSectionsList(currentMobileCategory);
}

function renderMobileSectionsList(categoryKey) {
  const sectionsList = document.querySelector('.mobile-sections-list');
  const sections = navigationData[categoryKey] || [];
  sectionsList.innerHTML = '';
  sections.forEach(section => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'mobile-section-item';
    const header = document.createElement('div');
    header.className = 'mobile-section-header';
    header.innerHTML = `<span>${escapeHtml(section.title)}</span><span class="arrow"></span>`;
    header.addEventListener('click', () => {
      document.querySelectorAll('.mobile-section-item.open').forEach(el => {
        if (el !== itemDiv) el.classList.remove('open');
      });
      itemDiv.classList.toggle('open');
    });
    const submenu = document.createElement('div');
    submenu.className = 'mobile-submenu-items';
    if (section.sections && section.sections.length) {
      section.sections.forEach(sub => {
        const subTitle = document.createElement('div');
        subTitle.className = 'mobile-subsection-title';
        subTitle.textContent = sub.title;
        submenu.appendChild(subTitle);
        if (sub.links) {
          sub.links.forEach(link => {
            const linkEl = document.createElement('a');
            linkEl.className = 'mobile-link';
            linkEl.href = link.href;
            linkEl.textContent = link.label;
            submenu.appendChild(linkEl);
          });
        }
      });
    } else {
      submenu.innerHTML = '<div class="mobile-link">Нет ссылок</div>';
    }
    itemDiv.appendChild(header);
    itemDiv.appendChild(submenu);
    sectionsList.appendChild(itemDiv);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


function toggleMobileVisibility() {
  const isMobile = window.innerWidth <= 900;
  const navList = document.querySelector('.nav__list');
  const mobileContainer = document.querySelector('.mobile-nav-container');
  if (isMobile) {
    navList.style.display = 'none';
    mobileContainer.style.display = 'block';
  } else {
    navList.style.display = 'flex';
    mobileContainer.style.display = 'none';
    const dropdown = document.querySelector('.dropdown');
    const overlay = document.querySelector('.overlay');
    dropdown.classList.remove('active');
    overlay.classList.remove('active');
  }
}


const burger = document.getElementById('burger');
const navMenu = document.getElementById('nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('is-open');
  navMenu.classList.toggle('is-open');
  if (navMenu.classList.contains('is-open')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.querySelectorAll('.mobile-section-item.open').forEach(el => el.classList.remove('open'));
  }
});


const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('[data-nav-link]');
window.addEventListener('scroll', () => {
  let current = '';
  const scrollPos = window.scrollY + 100;
  sections.forEach(section => {
    if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('is-active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('is-active');
    }
  });
});


let productsData = [];

async function loadProducts() {
  const response = await fetch('data/products.json');
  productsData = await response.json();
  renderProducts(productsData, 'all');
}

function renderProducts(products, activeCategory) {
  const container = document.getElementById('products-grid');
  const filtered = products.filter(p => p.categories.includes(activeCategory));
  container.innerHTML = filtered.map(product => `
    <a href="#" class="product" data-categories="${product.categories.join(' ')}">
      <div class="product__text">
        <h3 class="product__title">${product.title}</h3>
        <p class="product__desc">${product.desc}</p>
      </div>
      <div class="product__art">
        ${product.svg}
      </div>
    </a>
  `).join('');
}


function initTabs() {
  const tabsContainer = document.querySelector('[data-tabs="products"]');
  const tabs = tabsContainer.querySelectorAll('[data-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const category = tab.getAttribute('data-tab');
      renderProducts(productsData, category);
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  loadNavigation();
  loadProducts().then(initTabs);
});