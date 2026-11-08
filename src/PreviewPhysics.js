// Simulate at 50 Hz, independently of the display's refresh rate.
export const FIXED_STEP = 1 / 50;
const axes = ['x', 'y', 'z'];
const vector = () => ({ x: 0, y: 0, z: 0 });
const HALF_STEP = FIXED_STEP / 2;
const STIFFNESS = 100;
const DAMPING = 5;
// Solve the implicit trapezoidal rule for x' = v, v' = -k(x - target) - cv.
// The spring is linear, so the solve reduces to precomputed scalar factors.
const INVERSE_DENOMINATOR = 1 / (1 + DAMPING * HALF_STEP + STIFFNESS * HALF_STEP * HALF_STEP);
const VELOCITY_FACTOR = (1 - DAMPING * HALF_STEP - STIFFNESS * HALF_STEP * HALF_STEP) * INVERSE_DENOMINATOR;
const POSITION_FACTOR = STIFFNESS * FIXED_STEP * INVERSE_DENOMINATOR;
const TARGET_FACTOR = STIFFNESS * HALF_STEP * INVERSE_DENOMINATOR;
const YAW_RELAXATION = 1 - Math.pow(0.2, FIXED_STEP);

function stepSpring(position, velocity, axis, targetSum = 0) {
    const oldVelocity = velocity[axis];
    const newVelocity = VELOCITY_FACTOR * oldVelocity - POSITION_FACTOR * position[axis] + TARGET_FACTOR * targetSum;
    position[axis] += HALF_STEP * (oldVelocity + newVelocity);
    velocity[axis] = newVelocity;
}

export class PreviewPhysics {
    constructor() {
        this.position = vector();
        this.rotation = vector();
        this.previousPosition = vector();
        this.previousRotation = vector();
        this.velocity = vector();
        this.angularVelocity = { x: 0, y: 0.6, z: 0 };
        this.time = 0;
        this.accumulator = 0;
    }

    applyImpulse(impulse, offset) {
        // Unit mass; retain the original toy's reduced pitch response.
        for (const axis of axes) this.velocity[axis] += impulse[axis];
        this.angularVelocity.x += (offset.y * impulse.z - offset.z * impulse.y) / 3;
        this.angularVelocity.y += offset.z * impulse.x - offset.x * impulse.z;
        this.angularVelocity.z += offset.x * impulse.y - offset.y * impulse.x;
    }

    advance(elapsed) {
        // Bound catch-up after a stall, while preserving time at normal low FPS.
        this.accumulator += Math.min(Math.max(elapsed, 0), 0.25);
        while (this.accumulator + 1e-12 >= FIXED_STEP) {
            Object.assign(this.previousPosition, this.position);
            Object.assign(this.previousRotation, this.rotation);
            const oldTargetY = 0.1 * Math.sin(this.time * 2.5);
            this.time += FIXED_STEP;
            const targetSumY = oldTargetY + 0.1 * Math.sin(this.time * 2.5);
            for (const axis of axes) {
                stepSpring(this.position, this.velocity, axis, axis === 'y' ? targetSumY : 0);
                if (axis !== 'y') {
                    stepSpring(this.rotation, this.angularVelocity, axis);
                }
            }
            const targetYaw = this.angularVelocity.y >= 0 ? 0.6 : -0.6;
            const oldYawVelocity = this.angularVelocity.y;
            this.angularVelocity.y += (targetYaw - oldYawVelocity) * YAW_RELAXATION;
            this.rotation.y += HALF_STEP * (oldYawVelocity + this.angularVelocity.y);
            this.accumulator = Math.max(0, this.accumulator - FIXED_STEP);
        }
        return this.accumulator / FIXED_STEP;
    }
}
