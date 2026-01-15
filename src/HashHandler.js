const hash = window.location.hash;

if (hash) {
    const target = document.querySelector(hash);

    if (target && target.tagName.toLowerCase() === "details") {
        target.open = true;
    }
}