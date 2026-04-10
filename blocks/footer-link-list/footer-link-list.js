/**
 * Move Universal Editor / rich-text instrumentation attributes to a wrapper.
 * Inlined here so this block does not import scripts.js (avoids circular deps with loadBlock).
 * @param {Element} from
 * @param {Element} to
 */
function moveInstrumentationAttrs(from, to) {
  [...from.attributes]
    .map(({ name }) => name)
    .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-'))
    .forEach((attr) => {
      const value = from.getAttribute(attr);
      if (value) {
        to.setAttribute(attr, value);
        from.removeAttribute(attr);
      }
    });
}

/**
 * First row/cell that represents the list title after field collapse (heading or paragraph).
 * @param {Element} root
 * @returns {Element | null}
 */
function findTitleElement(root) {
  const firstEl = root.firstElementChild;
  if (firstEl?.matches?.('h1, h2, h3, h4, h5, h6, p')) return firstEl;

  const rows = [...root.children].filter((el) => el.tagName === 'DIV');
  const first = rows[0];
  if (!first) return null;
  const cells = [...first.children].filter((el) => el.tagName === 'DIV');
  const scan = cells.length ? cells : [first];
  for (const cell of scan) {
    const title = cell.querySelector(
      ':scope h1, :scope h2, :scope h3, :scope h4, :scope h5, :scope h6, :scope p',
    );
    if (title) return title;
  }
  return null;
}

/**
 * Wrap authored markup (heading + links from field collapse) in a nav landmark.
 * @param {Element} block
 */
export default function decorate(block) {
  if (!block.querySelector(':scope > *')) return;

  const nav = document.createElement('nav');
  nav.className = 'footer-link-list-inner';
  moveInstrumentationAttrs(block, nav);
  while (block.firstChild) nav.append(block.firstChild);
  block.append(nav);

  const titleEl = findTitleElement(nav);
  if (titleEl?.textContent?.trim()) {
    const slug = titleEl.textContent
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const base = slug ? `footer-link-list-${slug}` : 'footer-link-list-title';
    const suffix = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now());
    titleEl.id = titleEl.id || `${base}-${suffix}`.slice(0, 80);
    nav.setAttribute('aria-labelledby', titleEl.id);
  } else {
    nav.setAttribute('aria-label', 'Footer links');
  }
}
