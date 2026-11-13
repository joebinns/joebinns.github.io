// Keep this independent of the WebGL preview so the pins also work without it.
const { Bodies, Body, Composite, Engine, Query, Sleeping } = window.Matter;
const engine = Engine.create({ enableSleeping: true });
const step = 1000 / 50;
const pieces = [];
const collisionCategory = { photo: 1, pin: 2, wall: 4, floor: 8 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const layer = document.createElement('div');
layer.className = 'polaroid-physics';
layer.setAttribute('aria-hidden', 'true');

let boundaries = [];
let width = 0;
let floor = 0;
let frame = null;
let previousTime = null;
let accumulator = 0;

function updateBounds() {
    const previousWidth = width;
    const previousFloor = floor;
    // Measure the document without the overlay contributing to its height.
    layer.style.height = '0px';
    width = document.documentElement.clientWidth;
    floor = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    layer.style.height = `${floor}px`;
    for (const boundary of boundaries) Composite.remove(engine.world, boundary);
    const options = { isStatic: true, friction: 0.6, restitution: 0.2 };
    boundaries = [
        Bodies.rectangle(width / 2, floor + 50, width + 200, 100,
            { ...options, collisionFilter: { category: collisionCategory.floor } }),
        Bodies.rectangle(-50, floor / 2 - 500, 100, floor + 2000,
            { ...options, collisionFilter: { category: collisionCategory.wall } }),
        Bodies.rectangle(width + 50, floor / 2 - 500, 100, floor + 2000,
            { ...options, collisionFilter: { category: collisionCategory.wall } }),
    ];
    Composite.add(engine.world, boundaries);
    const positioned = [];
    for (const piece of pieces) {
        const { body, visual } = piece;
        if (previousWidth && previousWidth !== width) {
            // Leave room for rotation, even when a desktop photo moves to a small phone.
            const scale = Math.min(1, (width - 16) / Math.hypot(piece.width, piece.height));
            Body.scale(body, scale, scale);
            piece.width *= scale;
            piece.height *= scale;
            visual.style.width = `${piece.width}px`;
            visual.style.height = `${piece.height}px`;
            Body.setPosition(body, {
                x: body.position.x * width / previousWidth,
                y: body.position.y + floor - previousFloor,
            });
        }
        // Bring fallen objects back inside the page after a viewport change.
        const dx = Math.max(0, -body.bounds.min.x) - Math.max(0, body.bounds.max.x - width);
        const dy = Math.min(0, floor - body.bounds.max.y);
        Body.translate(body, { x: dx, y: dy });
        if (previousWidth && previousWidth !== width) {
            // Prevent overlapping teleported bodies from forcing each other through walls.
            let overlap;
            while ((overlap = positioned.find(other =>
                body.bounds.min.x < other.bounds.max.x && body.bounds.max.x > other.bounds.min.x &&
                body.bounds.min.y < other.bounds.max.y && body.bounds.max.y > other.bounds.min.y
            ))) {
                Body.translate(body, { x: 0, y: overlap.bounds.min.y - body.bounds.max.y - 4 });
            }
        }
        positioned.push(body);
        piece.previousPosition = { ...body.position };
        piece.previousAngle = body.angle;
        Sleeping.set(body, false);
    }
}

function angleOf(element) {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.atan2(matrix.b, matrix.a);
}

function addPiece(source, angle, isPin) {
    const rect = source.getBoundingClientRect();
    const pieceWidth = source.offsetWidth;
    const pieceHeight = source.offsetHeight;
    const visual = isPin ? document.createElement('span') : source.cloneNode();
    visual.className = `polaroid-body${isPin ? ' falling-pin' : ''}`;
    if (isPin) {
        visual.textContent = source.textContent.trim();
        visual.style.textShadow = getComputedStyle(source).textShadow;
    } else {
        visual.loading = 'eager';
        visual.alt = '';
        visual.draggable = false;
    }
    visual.style.width = `${pieceWidth}px`;
    visual.style.height = `${pieceHeight}px`;
    layer.append(visual);
    const body = Bodies.rectangle(
        rect.left + window.scrollX + rect.width / 2,
        rect.top + window.scrollY + rect.height / 2,
        pieceWidth, pieceHeight,
        {
            angle, restitution: isPin ? 0.48 : 0.65, friction: 0.65,
            frictionAir: isPin ? 0.008 : 0.004,
            // Pins pass through the photos and floor, so they always leave the page.
            collisionFilter: {
                category: isPin ? collisionCategory.pin : collisionCategory.photo,
                mask: isPin ? collisionCategory.wall : 0,
            },
        },
    );
    Composite.add(engine.world, body);
    pieces.push({
        body, visual, width: pieceWidth, height: pieceHeight, isPin,
        previousPosition: { ...body.position }, previousAngle: body.angle,
        collisionEnabled: isPin,
    });
    return body;
}

function render(alpha = 1) {
    for (const { body, visual, width, height, previousPosition, previousAngle } of pieces) {
        const x = previousPosition.x + (body.position.x - previousPosition.x) * alpha;
        const y = previousPosition.y + (body.position.y - previousPosition.y) * alpha;
        const angle = previousAngle + (body.angle - previousAngle) * alpha;
        visual.style.transform = `translate(${x - width / 2}px, ${y - height / 2}px) rotate(${angle}rad)`;
    }
}

function removePiece(index) {
    const { body, visual } = pieces[index];
    Composite.remove(engine.world, body);
    visual.remove();
    pieces.splice(index, 1);
}

function tick(time) {
    frame = null;
    if (previousTime !== null) accumulator += Math.min(time - previousTime, 100);
    previousTime = time;
    while (accumulator >= step) {
        for (const piece of pieces) {
            piece.previousPosition.x = piece.body.position.x;
            piece.previousPosition.y = piece.body.position.y;
            piece.previousAngle = piece.body.angle;
        }
        Engine.update(engine, step);
        const bodies = Composite.allBodies(engine.world);
        for (const piece of pieces) {
            if (!piece.isPin && !piece.collisionEnabled &&
                Query.collides(piece.body, bodies.filter(body => body !== piece.body)).length === 0) {
                piece.body.collisionFilter.mask = 0xFFFFFFFF;
                piece.collisionEnabled = true;
            }
        }
        accumulator -= step;
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
        if (pieces[i].isPin && pieces[i].body.bounds.min.y > floor) removePiece(i);
    }
    render(accumulator / step);
    if (pieces.some(({ body }) => !body.isSleeping)) {
        frame = requestAnimationFrame(tick);
    } else {
        previousTime = null;
        accumulator = 0;
    }
}

function start() {
    if (frame === null && !document.hidden) {
        previousTime = null;
        frame = requestAnimationFrame(tick);
    }
}

function settle() {
    // Honor reduced motion by placing the released objects at the bottom directly.
    cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
    accumulator = 0;
    for (let i = pieces.length - 1; i >= 0; i--) {
        if (pieces[i].isPin) removePiece(i);
    }
    for (const { body } of pieces) {
        Body.setAngle(body, 0);
        Body.translate(body, { x: 0, y: floor - body.bounds.max.y });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        body.force.x = 0;
        body.force.y = 0;
        body.torque = 0;
        Sleeping.set(body, true);
    }
    render();
}

for (const pin of document.querySelectorAll('.polaroid-pin')) {
    pin.addEventListener('click', () => {
        if (pin.disabled) return;
        if (!layer.isConnected) document.body.append(layer);
        updateBounds();
        const polaroid = pin.closest('.polaroid');
        const photoAngle = angleOf(polaroid);
        const photo = addPiece(polaroid.querySelector('.photo'), photoAngle, false);
        const pinBody = addPiece(pin, photoAngle + angleOf(pin), true);
        const direction = Math.random() < 0.5 ? -1 : 1;
        // The emoji's head points up-right before rotation. Pull along its shaft
        // toward the head, including both the pin's and the photo's rotation.
        const pullAngle = pinBody.angle - Math.PI / 4;
        const pullSpeed = 6 + Math.random() * 5;
        Body.setVelocity(pinBody, {
            x: Math.cos(pullAngle) * pullSpeed,
            y: Math.sin(pullAngle) * pullSpeed,
        });
        Body.setAngularVelocity(pinBody, direction * (0.04 + Math.random() * 0.06));
        Body.setVelocity(photo, { x: -direction * (0.3 + Math.random() * 0.5), y: 0 });
        Body.setAngularVelocity(photo, direction * (0.035 + Math.random() * 0.045));
        pin.disabled = true;
        polaroid.classList.add('is-released');
        render();
        if (reducedMotion.matches) settle();
        else start();
    });
}

window.addEventListener('resize', () => {
    if (!pieces.length) return;
    updateBounds();
    if (reducedMotion.matches) settle();
    else start();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = null;
        previousTime = null;
        accumulator = 0;
    } else if (pieces.length && !reducedMotion.matches) start();
});

reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settle();
});
