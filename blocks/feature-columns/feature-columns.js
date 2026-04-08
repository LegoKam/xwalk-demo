import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Resolve CTA href from an authored link cell (anchor or nested).
 * @param {Element | undefined} linkCell
 * @returns {string}
 */
function getLinkHref(linkCell) {
  if (!linkCell) return '';
  const direct = linkCell.matches('a[href]') ? linkCell : null;
  const nested = linkCell.querySelector('a[href]');
  const a = direct || nested;
  return a?.href || '';
}

/**
 * decorate the feature-columns block — each row is one column (image, text, CTA).
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    const cells = [...li.children];
    const imageCell = cells[0];
    const bodyCell = cells[1];
    const linkCell = cells[2];
    const labelCell = cells[3];

    if (imageCell) imageCell.classList.add('feature-columns-image');
    if (bodyCell) bodyCell.classList.add('feature-columns-body');

    const label = (labelCell?.textContent || '').trim();
    const existingA = linkCell && (linkCell.tagName === 'A' ? linkCell : linkCell.querySelector('a[href]'));

    const cta = document.createElement('p');
    cta.className = 'feature-columns-cta button-container';

    if (existingA) {
      existingA.classList.add('button');
      if (label) existingA.textContent = label;
      cta.append(existingA);
      if (linkCell !== existingA) linkCell.remove();
    } else {
      const a = document.createElement('a');
      a.className = 'button';
      a.href = getLinkHref(linkCell) || '#';
      a.textContent = label || 'Learn more';
      cta.append(a);
      linkCell?.remove();
    }

    labelCell?.remove();
    li.append(cta);

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.replaceChildren(ul);
}
