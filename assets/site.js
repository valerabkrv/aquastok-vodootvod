/* Водоотвод Aquastok — каталог с вкладками и окно товара.
   Данные — assets/data.js (AQ_TABS, AQ_ITEMS). Цены — блок AQ_PRICES
   в index.html: он же целиком уезжает в код блока T123 для Тильды. */

/* На GitHub Pages сайт лежит целиком и пути в data.js относительные.
   В блоке T123 страницу отдаёт Тильда, а картинки и скрипты остаются на
   Pages — тогда блок заранее кладёт адрес Pages в window.AQ_ASSET_BASE,
   и все относительные пути склеиваются с ним. */
var AQ_BASE = (typeof window !== 'undefined' && typeof window.AQ_ASSET_BASE === 'string')
  ? window.AQ_ASSET_BASE : '';
var AQ_LOGO = 'assets/images/aquastok-logo.png';
var AQ_UNIT = '₽';

function asset(p) {
  if (!p || !AQ_BASE || p.indexOf('http') === 0 || p.indexOf('//') === 0) return p;
  return AQ_BASE + p;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* «1 250» -> 1250. Пустая строка и любой текст («по запросу») -> null. */
function priceNum(s) {
  var t = String(s == null ? '' : s).replace(/\s+/g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? parseFloat(t) : null;
}

/* Цены из блока T123. У каждой модификации (строки таблицы в карточке)
   своя цена, ключ — её точное название. Неизвестный ключ пишет
   предупреждение в консоль, иначе опечатку в названии не заметить. */
function applyPrices(map, unit, items) {
  if (!map) return;
  if (unit) AQ_UNIT = unit;
  var known = {};
  (items || []).forEach(function (m) {
    (m.rows || []).forEach(function (r) {
      known[r.key] = true;
      if (Object.prototype.hasOwnProperty.call(map, r.key)) r.price = String(map[r.key]).trim();
    });
  });
  Object.keys(map).forEach(function (k) {
    if (!known[k]) console.warn('AQ_PRICES: позиция «' + k + '» не найдена — проверьте название');
  });
}

function isGroup(m) { return (m.rows || []).length > 1; }

/* Самая низкая из проставленных цен товара — для плитки («от …») */
function minPrice(m) {
  var best = null, txt = null;
  (m.rows || []).forEach(function (r) {
    var n = priceNum(r.price);
    if (n !== null && (best === null || n < best)) { best = n; txt = String(r.price).trim(); }
  });
  return txt;
}

function priceHtml(m) {
  var p = minPrice(m);
  if (p === null) return '<span class="price price-ask">Цена по запросу</span>';
  return '<span class="price">' + (isGroup(m) ? 'от ' : '') + esc(p) +
    ' <small>' + esc(AQ_UNIT) + '</small></span>';
}

var MODEL_INDEX = {};   // slug -> товар
var TAB_INDEX = {};     // id вкладки -> вкладка
var CATALOG = null;     // контейнер каталога

/* ---------- плитка ---------- */
function modelTile(m) {
  return '<a href="#' + m.slug + '" class="model-tile" data-key="' + m.slug + '">' +
    '<span class="model-tile-media">' +
      '<img class="docke-badge" src="' + asset(AQ_LOGO) + '" alt="Aquastok">' +
      '<img src="' + asset(m.hero) + '" alt="' + esc(m.alt || m.name) + '" loading="lazy">' +
      '<span class="model-tile-hint">Подробнее</span>' +
    '</span>' +
    '<span class="model-tile-body">' +
      '<span class="model-tile-name">' + esc(m.name) + '</span>' +
      '<span class="model-tile-short">' + esc(m.short) + '</span>' +
      '<span class="model-tile-meta">' + priceHtml(m) +
        '<span class="width">' + esc(m.meta || '') + '</span>' +
      '</span>' +
    '</span>' +
  '</a>';
}

/* ---------- каталог: вкладки + по сетке плиток на каждую ---------- */
function renderCatalog(hostId, tabs, items) {
  CATALOG = document.getElementById(hostId);
  if (!CATALOG || !tabs || !items) return;

  var byTab = {};
  items.forEach(function (m) {
    MODEL_INDEX[m.slug] = m;
    (byTab[m.tab] = byTab[m.tab] || []).push(m);
  });
  tabs.forEach(function (t) { TAB_INDEX[t.id] = t; });

  CATALOG.innerHTML =
    '<div class="aq-tabs" role="tablist" aria-label="Разделы каталога">' +
      tabs.map(function (t, i) {
        return '<button type="button" class="aq-tab' + (i ? '' : ' is-active') + '" role="tab"' +
          ' id="tabbtn-' + t.id + '" aria-controls="tab-' + t.id + '"' +
          ' aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? '-1' : '0') + '"' +
          ' data-tab="' + t.id + '">' + esc(t.title) +
          '<span class="aq-tab-count">' + (byTab[t.id] || []).length + '</span></button>';
      }).join('') +
    '</div>' +
    tabs.map(function (t, i) {
      return '<div class="aq-panel' + (i ? '' : ' is-active') + '" role="tabpanel"' +
          ' id="tab-' + t.id + '" aria-labelledby="tabbtn-' + t.id + '">' +
        '<div class="aq-panel-head">' +
          '<h3 class="aq-panel-title">' + esc(t.heading || t.title) + '</h3>' +
          (t.lead ? '<p class="aq-panel-lead">' + esc(t.lead) + '</p>' : '') +
        '</div>' +
        '<div class="model-grid">' + (byTab[t.id] || []).map(modelTile).join('') + '</div>' +
      '</div>';
    }).join('');
}

function showTab(id, focus) {
  if (!CATALOG || !TAB_INDEX[id]) return;
  Array.prototype.forEach.call(CATALOG.querySelectorAll('.aq-tab'), function (b) {
    var on = b.getAttribute('data-tab') === id;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    b.setAttribute('tabindex', on ? '0' : '-1');
    if (on && focus) b.focus();
  });
  Array.prototype.forEach.call(CATALOG.querySelectorAll('.aq-panel'), function (p) {
    p.classList.toggle('is-active', p.id === 'tab-' + id);
  });
}

function scrollToCatalog() {
  var c = document.getElementById('catalog');
  if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Вкладка пишется в адрес без новой записи в истории: «Назад» не должен
   перелистывать вкладки, а ссылкой #norma-plastik можно поделиться. */
function setHash(h) {
  try { history.replaceState(null, '', location.pathname + location.search + (h ? '#' + h : '')); } catch (err) {}
}

/* ---------- таблица модификаций в окне ---------- */
function modsHtml(m) {
  var rows = m.rows || [];
  if (!m.cols || rows.length < 2) return '';   // одна модификация — её данные уже в характеристиках
  var anyPrice = rows.some(function (r) { return priceNum(r.price) !== null; });
  return '<div class="mod-block">' +
    '<p class="mod-title">' + esc(m.modsTitle || 'Модификации') + '</p>' +
    '<div class="table-scroll"><table class="mod-table"><thead><tr>' +
      m.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
      (anyPrice ? '<th>Цена</th>' : '') +
    '</tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr><td class="mod-name">' + esc(r.label) + '</td>' +
        (r.cells || []).map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') +
        (anyPrice
          ? '<td class="mod-price">' + (priceNum(r.price) !== null ? esc(r.price) + ' ' + esc(AQ_UNIT) : '—') + '</td>'
          : '') +
      '</tr>';
    }).join('') +
    '</tbody></table></div></div>';
}

/* ---------- содержимое окна ---------- */
function modelDetailHtml(key) {
  var m = MODEL_INDEX[key];
  if (!m) return '';
  var tab = TAB_INDEX[m.tab] || {};
  var price = minPrice(m);

  var propsHtml = (m.props || []).map(function (p) {
    return '<div><span class="k">' + esc(p[0]) + '</span><span class="v">' + esc(p[1]) + '</span></div>';
  }).join('');

  var shots = [m.hero].concat(m.gallery || []);
  var thumbs = shots.length < 2 ? '' :
    '<div class="model-thumbs">' + shots.map(function (src, i) {
      return '<button type="button" class="model-thumb' + (i === 0 ? ' is-active' : '') + '"' +
        ' data-img="' + asset(src) + '" aria-label="Фото ' + (i + 1) + '">' +
        '<img src="' + asset(src) + '" alt="" loading="lazy"></button>';
    }).join('') + '</div>';

  return '<div class="collection-head">' +
      '<div class="collection-hero-col">' +
        '<div class="collection-hero">' +
          '<img class="docke-badge" src="' + asset(AQ_LOGO) + '" alt="Aquastok">' +
          '<img class="model-modal-photo" src="' + asset(m.hero) + '" alt="' + esc(m.alt || m.name) + '">' +
        '</div>' +
        thumbs +
        '<a href="#contacts" class="btn">Где купить</a>' +
      '</div>' +
      '<div class="collection-head-text">' +
        '<span class="collection-tag">' + esc(tab.heading || tab.title || '') + '</span>' +
        '<div class="collection-title-row">' +
          '<h3 class="section-title collection-title" style="font-size:22px">' + esc(m.name) + '</h3>' +
          (price !== null
            ? '<div class="collection-price">' + (isGroup(m) ? 'Цена от ' : 'Цена ') +
                '<span>' + esc(price) + '</span> ' + esc(AQ_UNIT) + '</div>'
            : '') +
        '</div>' +
        '<p class="section-sub">' + esc(m.desc) + '</p>' +
        (propsHtml ? '<div class="model-props">' + propsHtml + '</div>' : '') +
        modsHtml(m) +
        (m.note ? '<p class="model-note">' + esc(m.note) + '</p>' : '') +
      '</div>' +
    '</div>';
}

/* ---------- окно ---------- */
var MODAL = null;          // корневой элемент окна
var MODAL_PUSHED = false;  // добавляли ли мы запись в историю
var MODAL_SCROLL = null;   // сохранённые inline-стили overflow

function modalRoot() {
  if (MODAL) return MODAL;
  MODAL = document.createElement('div');
  MODAL.className = 'model-modal';
  MODAL.setAttribute('role', 'dialog');
  MODAL.setAttribute('aria-modal', 'true');
  MODAL.innerHTML =
    '<div class="model-modal-backdrop" data-close="1"></div>' +
    '<div class="model-modal-dialog">' +
      '<button type="button" class="model-modal-close" data-close="1" aria-label="Закрыть">&times;</button>' +
      '<div class="model-modal-body"></div>' +
    '</div>';
  /* Внутрь блока, а не в body: в Тильде весь CSS ограничен областью
     видимости .aq, и окно, висящее в body, осталось бы без стилей. */
  (document.querySelector('.aq') || document.body).appendChild(MODAL);

  MODAL.addEventListener('click', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-close')) { e.preventDefault(); closeModel(); return; }

    var th = t.closest ? t.closest('.model-thumb') : null;
    if (th) {
      var photo = MODAL.querySelector('.model-modal-photo');
      if (photo) photo.src = th.getAttribute('data-img');
      Array.prototype.forEach.call(MODAL.querySelectorAll('.model-thumb'), function (x) {
        x.classList.remove('is-active');
      });
      th.classList.add('is-active');
      return;
    }

    var cta = t.closest ? t.closest('a[href="#contacts"]') : null;
    if (cta) {
      e.preventDefault();
      /* историю правим сами: history.back() вернул бы прокрутку
         на прежнее место и отменил переход к контактам */
      MODAL_PUSHED = false;
      setHash('');
      closeModel(true);
      var c = document.getElementById('contacts');
      if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return MODAL;
}

function openModel(key, push) {
  if (!MODEL_INDEX[key]) return;
  var el = modalRoot();
  el.querySelector('.model-modal-body').innerHTML = modelDetailHtml(key);
  el.classList.add('is-open');
  el.scrollTop = 0;

  if (MODAL_SCROLL === null) {
    MODAL_SCROLL = [document.documentElement.style.overflow, document.body.style.overflow];
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  if (push) {
    try { history.pushState({ aqModel: key }, '', '#' + key); MODAL_PUSHED = true; } catch (err) {}
  }
  var close = el.querySelector('.model-modal-close');
  if (close) close.focus();
}

function closeModel(fromHistory) {
  if (!MODAL || !MODAL.classList.contains('is-open')) return;
  MODAL.classList.remove('is-open');
  MODAL.querySelector('.model-modal-body').innerHTML = '';
  if (MODAL_SCROLL) {
    document.documentElement.style.overflow = MODAL_SCROLL[0];
    document.body.style.overflow = MODAL_SCROLL[1];
    MODAL_SCROLL = null;
  }
  if (!fromHistory) {
    if (MODAL_PUSHED) { MODAL_PUSHED = false; history.back(); }
    else setHash('');
  }
}

/* ---------- обработчики ---------- */
function initCatalog() {
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest || t.closest('.model-modal')) return;   // окно обрабатывает свои клики само

    /* вкладка каталога или ссылка на неё (например, из классов нагрузки) */
    var tabEl = t.closest('[data-tab]');
    if (tabEl) {
      var id = tabEl.getAttribute('data-tab');
      if (!TAB_INDEX[id]) return;
      e.preventDefault();
      showTab(id);
      setHash(id);
      if (!tabEl.classList.contains('aq-tab')) scrollToCatalog();
      return;
    }

    /* плитка или ссылка на конкретный товар */
    var src = t.closest('[data-key]');
    if (!src) return;
    var key = src.getAttribute('data-key');
    if (!MODEL_INDEX[key]) return;
    e.preventDefault();
    showTab(MODEL_INDEX[key].tab);
    openModel(key, true);
  });

  /* стрелки на вкладках — как в обычном переключателе */
  if (CATALOG) CATALOG.addEventListener('keydown', function (e) {
    var b = e.target.closest ? e.target.closest('.aq-tab') : null;
    if (!b) return;
    var list = Array.prototype.slice.call(CATALOG.querySelectorAll('.aq-tab'));
    var i = list.indexOf(b), j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % list.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + list.length) % list.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = list.length - 1;
    if (j < 0) return;
    e.preventDefault();
    var id = list[j].getAttribute('data-tab');
    showTab(id, true);
    setHash(id);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) closeModel();
  });

  window.addEventListener('popstate', function () {
    var key = (location.hash || '').replace(/^#/, '');
    MODAL_PUSHED = false;
    if (MODEL_INDEX[key]) { showTab(MODEL_INDEX[key].tab); openModel(key, false); }
    else {
      closeModel(true);
      if (TAB_INDEX[key]) showTab(key);
    }
  });

  /* прямая ссылка: #<товар> открывает карточку, #<вкладка> — раздел */
  var start = (location.hash || '').replace(/^#/, '');
  if (MODEL_INDEX[start]) { showTab(MODEL_INDEX[start].tab); openModel(start, false); }
  else if (TAB_INDEX[start]) { showTab(start); scrollToCatalog(); }
}
