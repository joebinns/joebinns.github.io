function revealHash() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); }
    catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    // Reveal ancestors too, so nested code examples can be linked directly.
    let parent = target;
    while (parent) {
        if (parent.tagName === 'DETAILS') parent.open = true;
        parent = parent.parentElement;
    }
    target.scrollIntoView();
}
window.addEventListener('hashchange', revealHash);
revealHash();
