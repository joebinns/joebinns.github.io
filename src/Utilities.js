export function isElementHovered(element) {
    if (element == null) return null;
    return element == element.parentElement.querySelector(":hover");
}

export function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}