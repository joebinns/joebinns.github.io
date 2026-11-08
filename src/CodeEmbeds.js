// The embed provider uses document.currentScript and supports dynamic insertion.
const pending = new Set(document.querySelectorAll('script[data-code-embed]'));
function loadOpenEmbeds() {
    for (const marker of pending) {
        let ancestor = marker.parentElement;
        let open = true;
        while (ancestor) {
            if (ancestor.tagName === 'DETAILS' && !ancestor.open) { open = false; break; }
            ancestor = ancestor.parentElement;
        }
        if (!open) continue;
        const script = document.createElement('script');
        script.src = marker.dataset.codeEmbed;
        marker.replaceWith(script);
        pending.delete(marker);
    }
}
document.addEventListener('toggle', loadOpenEmbeds, true);
loadOpenEmbeds();
