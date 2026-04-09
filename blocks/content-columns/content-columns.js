import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Parse block style tokens from the config row (multiselect → comma-separated text).
 * @param {string} raw
 * @returns {string[]}
 */
function parseClassTokens(raw) {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {Element} row
 * @returns {number}
 */
function getColumnIndex(row) {
  const first = row.children[0];
  const n = parseInt(first?.textContent?.trim() ?? '', 10);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * @param {Element} card
 */
function decorateCtaCard(card) {
  card.classList.add('content-columns-card--cta');
  card.children[0]?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'content-columns-card-inner';
  while (card.firstChild) wrap.append(card.firstChild);
  card.append(wrap);

  const btn = wrap.querySelector('a[href]');
  if (btn) {
    btn.classList.add('content-columns-cta-btn');
    const icon = document.createElement('span');
    icon.className = 'content-columns-cta-icon';
    icon.setAttribute('aria-hidden', 'true');
    btn.append(icon);
    const ctaHost = btn.closest('p') || btn;
    ctaHost.classList.add('content-columns-cta-wrap');
  }
}

/**
 * @param {Element} card
 */
function decorateLinksCard(card) {
  card.classList.add('content-columns-card--links');
  const cells = [...card.children];
  let styleRaw = '';
  const ulCell = cells.find((c) => c.querySelector('ul'));
  cells.forEach((c) => {
    if (c === ulCell) return;
    const t = c.textContent?.trim() ?? '';
    if (!c.querySelector('ul') && !c.querySelector('h1, h2, h3, h4, h5, h6') && (t === 'primary-links' || t === 'curated')) {
      styleRaw = t;
    }
  });
  if (!styleRaw) {
    const last = cells[cells.length - 1];
    const t = last?.textContent?.trim() ?? '';
    if (t === 'primary-links' || t === 'curated') styleRaw = t;
  }

  if (styleRaw === 'primary-links') {
    card.classList.add('content-columns-card--links-primary');
  } else {
    card.classList.add('content-columns-card--links-curated');
  }

  card.children[0]?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'content-columns-card-inner';
  const remaining = [...card.children];
  remaining.forEach((cell) => {
    const t = cell.textContent?.trim() ?? '';
    if (!cell.querySelector('ul') && (t === 'primary-links' || t === 'curated')) {
      cell.remove();
      return;
    }
    wrap.append(cell);
  });
  card.append(wrap);

  let nav = wrap.querySelector('ul');
  if (!nav && wrap.querySelector('a[href]')) {
    const orphanA = wrap.querySelector('a[href]');
    if (orphanA) {
      nav = document.createElement('ul');
      const li = document.createElement('li');
      li.append(orphanA);
      nav.append(li);
      wrap.append(nav);
    }
  }
  if (nav) nav.classList.add('content-columns-link-list');
}

/**
 * @param {Element} card
 */
function decorateInfoCard(card) {
  card.classList.add('content-columns-card--info');
  card.children[0]?.remove();
  const wrap = document.createElement('div');
  wrap.className = 'content-columns-card-inner';
  while (card.firstChild) wrap.append(card.firstChild);
  card.append(wrap);

  const titleEl = wrap.querySelector('h2, h3, h4, h5, h6');
  if (titleEl) titleEl.classList.add('content-columns-info-heading');

  wrap.querySelectorAll('ul > li').forEach((li) => {
    li.classList.add('content-columns-info-row');
    const divs = [...li.children].filter((el) => el.tagName === 'DIV');
    let labelEl;
    let valueEl;
    if (divs.length >= 2) {
      [labelEl, valueEl] = divs;
    } else {
      const text = li.textContent || '';
      const sep = text.indexOf(':');
      if (sep > -1) {
        labelEl = document.createElement('span');
        labelEl.className = 'content-columns-info-label';
        labelEl.textContent = `${text.slice(0, sep).trim()}:`;
        valueEl = document.createElement('span');
        valueEl.className = 'content-columns-info-value';
        valueEl.textContent = text.slice(sep + 1).trim();
        li.textContent = '';
        li.append(labelEl, valueEl);
      }
    }

    if (labelEl && !labelEl.classList.contains('content-columns-info-label')) {
      labelEl.classList.add('content-columns-info-label');
    }
    if (valueEl && !valueEl.classList.contains('content-columns-info-value')) {
      valueEl.classList.add('content-columns-info-value');
    }

    const valueNode = valueEl || li.querySelector('.content-columns-info-value');
    const copyVal = (valueNode?.textContent ?? '').trim();
    if (valueNode && copyVal) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'content-columns-copy';
      btn.setAttribute('data-copy-value', copyVal);
      btn.setAttribute('aria-label', `Copy ${copyVal}`);
      btn.innerHTML = '<span class="content-columns-copy-icon" aria-hidden="true"></span>';
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(copyVal);
          btn.classList.add('content-columns-copy--done');
          setTimeout(() => btn.classList.remove('content-columns-copy--done'), 2000);
        } catch (e) {
          /* clipboard may be unavailable */
        }
      });
      valueNode.after(btn);
    }
  });
}

/**
 * Guess segment layout from delivered cells (CTA vs links vs info).
 * @param {Element} row
 * @returns {'cta' | 'links' | 'info'}
 */
function classifySegment(row) {
  const cells = [...row.children];
  const body = cells.slice(1);

  const styleHint = body.some((c) => {
    const t = c.textContent?.trim() ?? '';
    return t === 'primary-links' || t === 'curated';
  });

  const linkListCell = body.find((c) => {
    const ul = c.querySelector('ul');
    if (!ul) return false;
    const lis = [...ul.querySelectorAll('li')];
    return lis.length > 0 && lis.every((li) => li.querySelector('a[href]'));
  });
  if (linkListCell || styleHint) return 'links';

  const hasHeading = body.some((c) => c.querySelector('h2, h3, h4, h5, h6'));
  const hasList = body.some((c) => c.querySelector('ul > li'));
  if (hasHeading && hasList) return 'info';

  return 'cta';
}

/**
 * @param {Element} card
 * @param {'cta' | 'links' | 'info'} kind
 */
function decorateSegmentCard(card, kind) {
  if (kind === 'links') decorateLinksCard(card);
  else if (kind === 'info') decorateInfoCard(card);
  else decorateCtaCard(card);
}

/**
 * decorate the Content Columns block — config row, then column segments stacked per index.
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const configRow = rows[0];
  const columnCountRaw = configRow.children[0]?.textContent?.trim() ?? '1';
  let columnCount = parseInt(columnCountRaw, 10);
  if (!Number.isFinite(columnCount) || columnCount < 1) columnCount = 1;
  if (columnCount > 12) columnCount = 12;

  const styleCell = configRow.children[1];
  if (styleCell) {
    parseClassTokens(styleCell.textContent ?? '').forEach((c) => block.classList.add(c));
  }

  block.style.setProperty('--content-columns-cols', String(columnCount));

  const segmentRows = rows.slice(1);
  const columns = Array.from({ length: columnCount }, () => []);

  segmentRows.forEach((row) => {
    const colIdx = getColumnIndex(row);
    if (!Number.isFinite(colIdx) || colIdx < 1 || colIdx > columnCount) return;
    columns[colIdx - 1].push(row);
  });

  const grid = document.createElement('div');
  grid.className = 'content-columns-grid';

  columns.forEach((colRows) => {
    const col = document.createElement('div');
    col.className = 'content-columns-col';
    const stack = document.createElement('div');
    stack.className = 'content-columns-stack';

    if (colRows.length === 1) {
      stack.classList.add('content-columns-stack--single');
    }

    colRows.forEach((row) => {
      const kind = classifySegment(row);
      const card = document.createElement('div');
      card.className = 'content-columns-card';
      moveInstrumentation(row, card);
      while (row.firstChild) card.append(row.firstChild);
      decorateSegmentCard(card, kind);
      stack.append(card);
    });

    col.append(stack);
    grid.append(col);
  });

  block.replaceChildren(grid);
}
