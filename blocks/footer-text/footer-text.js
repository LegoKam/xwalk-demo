/**
 * Copies plain text via the Async Clipboard API (HTTPS or localhost).
 * @param {string} text
 * @returns {Promise<void>}
 */
async function writeTextToClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API not available');
  }
  await navigator.clipboard.writeText(text);
}

/**
 * Footer Text — bordered rich text; :icon-copy: copies the text of the parent of the nearest `p`.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  block.querySelectorAll('span.icon.icon-copy').forEach((trigger) => {
    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    if (!trigger.getAttribute('aria-label')) {
      trigger.setAttribute('aria-label', 'Copy text to clipboard');
    }
    if (!trigger.getAttribute('title')) {
      trigger.setAttribute('title', 'Copy to clipboard');
    }

    const copyParentOfP = (event) => {
      event.preventDefault();
      const paragraph = trigger.closest('p');
      const source = paragraph?.parentElement;
      if (!source) return;
      const text = source.innerText.trim();
      writeTextToClipboard(text).catch(() => {});
    };

    trigger.addEventListener('click', copyParentOfP);
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        copyParentOfP(event);
      }
    });
  });
}
