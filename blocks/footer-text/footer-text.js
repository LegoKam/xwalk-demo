/**
 * Footer Text — bordered rich text container.
 * @param {Element} block
 */
export default function decorate(block) {
  block.querySelectorAll('span.icon.icon-copy').forEach((icon) => {
    icon.addEventListener('click', () => {
      const p = icon.closest('p');
      if (p) navigator.clipboard.writeText(p.textContent.trim());
    });
  });
}
