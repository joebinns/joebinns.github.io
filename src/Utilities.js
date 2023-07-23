export function isElementHovered(element) {
    if (element == null) return null;
    return element == element.parentElement.querySelector(":hover");
}

export function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

export function cubicBezier(t, P = [0.0, 0.1, 0.9, 1.0]) {
    return Math.pow(1 - t, 3) * P[0] +
        3 * Math.pow(1 - t, 2) * t * P[1] +
        3 * (1 - t) * Math.pow(t, 2) * P[2] +
        Math.pow(t, 3) * P[3];
}