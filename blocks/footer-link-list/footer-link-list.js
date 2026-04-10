import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Wrap authored markup (heading + links from field collapse) in a nav landmark.
 * @param {Element} block
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.className = 'footer-link-list-inner';
  moveInstrumentation(block, nav);
  while (block.firstChild) nav.append(block.firstChild);
  block.append(nav);

  const heading = nav.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent?.trim()) {
    const slug = heading.textContent
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = slug ? `footer-link-list-${slug}`.slice(0, 80) : 'footer-link-list-heading';
    heading.id = heading.id || id;
    nav.setAttribute('aria-labelledby', heading.id);
  } else {
    nav.setAttribute('aria-label', 'Footer links');
  }
}
