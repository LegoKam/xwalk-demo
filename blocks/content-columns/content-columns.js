const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

/**
 * @param {string} text
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* execCommand fallback for insecure contexts */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/**
 * @param {Element} row
 * @returns {'links'|'info'|'cta'}
 */
function classifyRow(row) {
  if (row.querySelector('ul a[href]')) {
    return 'links';
  }
  const cells = [...row.children];
  const third = cells[2];
  if (third && third.querySelector('ul > li') && !third.querySelector('ul a[href]')) {
    return 'info';
  }
  return 'cta';
}

/**
 * @param {Element} row
 */
function enhanceInfoRow(row) {
  const kind = classifyRow(row);
  if (kind !== 'info') return;

  const cells = [...row.children];
  const valueCell = cells[2] || cells[cells.length - 1];
  if (!valueCell) return;

  valueCell.querySelectorAll('ul > li').forEach((li) => {
    const valueEl = li.querySelector('p:last-of-type') || li;
    const text = (valueEl.textContent || '').trim();
    if (!text || li.querySelector('.content-columns-copy')) return;

    const wrap = document.createElement('span');
    wrap.className = 'content-columns-info-value';
    while (valueEl.firstChild) wrap.append(valueEl.firstChild);
    valueEl.append(wrap);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'content-columns-copy';
    btn.setAttribute('aria-label', 'Copy value to clipboard');
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', () => copyToClipboard(text));
    wrap.append(btn);
  });
}

/**
 * @param {Element} block
 */
function applyBlockOptions(block) {
  const first = block.firstElementChild;
  if (!first) return;

  const cells = [...first.children];
  const countRaw = (cells[0]?.textContent || '').trim();
  const n = parseInt(countRaw, 10);
  const columnCount = Number.isFinite(n) && n > 0 ? Math.min(n, 12) : 5;
  block.style.setProperty('--content-columns-count', String(columnCount));

  const classesCell = (cells[1]?.textContent || '').trim();
  if (classesCell) {
    classesCell.split(/[\s,]+/).filter(Boolean).forEach((c) => {
      block.classList.add(c);
    });
  }
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  applyBlockOptions(block);

  const rows = [...block.children];
  if (rows.length <= 1) {
    block.classList.add('content-columns-grid');
    return;
  }

  const itemRows = rows.slice(1);
  const columnCount = parseInt(
    getComputedStyle(block).getPropertyValue('--content-columns-count') || '5',
    10,
  ) || 5;

  /** @type {Element[][]} */
  const cols = Array.from({ length: columnCount }, () => []);

  itemRows.forEach((row) => {
    const idxCell = row.firstElementChild;
    const colIdx = parseInt((idxCell?.textContent || '').trim(), 10);
    const target = Number.isFinite(colIdx) && colIdx >= 1 && colIdx <= columnCount
      ? colIdx - 1
      : 0;
    cols[target].push(row);
  });

  const grid = document.createElement('div');
  grid.className = 'content-columns-grid';

  cols.forEach((stack, i) => {
    const col = document.createElement('div');
    col.className = 'content-columns-col';
    col.dataset.colIndex = String(i + 1);

    stack.forEach((row) => {
      const kind = classifyRow(row);
      row.classList.add(
        'content-columns-stack-item',
        kind === 'links' ? 'content-columns-links' : kind === 'info' ? 'content-columns-info' : 'content-columns-cta',
      );
      if (kind === 'links') {
        const styleText = (row.children[2]?.textContent || '').trim();
        if (styleText === 'primary-links') row.classList.add('is-primary-links');
        if (styleText === 'curated') row.classList.add('is-curated');
      }
      enhanceInfoRow(row);
      col.append(row);
    });

    grid.append(col);
  });

  block.replaceChildren(grid);
}
