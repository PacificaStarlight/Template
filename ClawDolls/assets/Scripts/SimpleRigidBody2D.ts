import { _decorator, CCBoolean, CCFloat, Component, Node, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SimpleRigidBody2D')
export class SimpleRigidBody2D extends Component {
    // 物理属性
    @property({ type: CCFloat, tooltip: "质量" })
    mass: number = 1.0; // 质量

    @property({ type: Vec2, tooltip: "重力加速度" })
    gravity: Vec2 = new Vec2(0, -300); // 重力加速度

    @property({ type: CCFloat, tooltip: "线性阻尼（空气阻力/摩擦力）" })
    linearDamping: number = 0.99; // 线性阻尼（空气阻力/摩擦力）

    @property({ type: CCFloat, tooltip: "接触摩擦力" })
    friction: number = 0.95; // 接触摩擦力

    @property({ type: CCBoolean, tooltip: "是否使用重力" })
    useGravity: boolean = true; // 是否使用重力

    @property({ type: CCBoolean, tooltip: "是否为运动学刚体（不受力影响）" })
    isKinematic: boolean = false; // 是否为运动学刚体（不受力影响）

    // 速度向量
    private _velocity: Vec2 = new Vec2(0, 0);
    private _angularVelocity: number = 0;

    // 力相关
    private _force: Vec2 = new Vec2(0, 0);
    private _impulse: Vec2 = new Vec2(0, 0);

    // 状态
    private _isSleeping: boolean = false;
    private _sleepThreshold: number = 0.1;

    get velocity(): Vec2 { return this._velocity.clone(); }
    set velocity(value: Vec2) { this._velocity.set(value); }

    get angularVelocity(): number { return this._angularVelocity; }
    set angularVelocity(value: number) { this._angularVelocity = value; }

    start() {
        // 初始化
    }

    update(deltaTime: number) {
        if (this._isSleeping || this.isKinematic) return;

        this.updatePhysics(deltaTime);
    }

    fixedUpdate(deltaTime: number) {
        // 如果需要固定时间步长的物理更新，可以在这里实现
    }

    private updatePhysics(deltaTime: number) {
        // 应用重力
        if (this.useGravity) {
            this.applyForce(this.gravity);
        }

        // 计算加速度 (F = ma => a = F/m)
        const acceleration = new Vec2();
        Vec2.divide(acceleration, this._force, new Vec2(this.mass, this.mass));

        // 更新速度 (v = v0 + a*t)
        Vec2.scaleAndAdd(this._velocity, this._velocity, acceleration, deltaTime);

        // 应用冲量
        Vec2.scaleAndAdd(this._velocity, this._velocity, this._impulse, 1 / this.mass);

        // 应用阻尼
        Vec2.multiplyScalar(this._velocity, this._velocity, this.linearDamping);

        // 应用角速度
        if (Math.abs(this._angularVelocity) > 0.01) {
            this.node.angle += this._angularVelocity * deltaTime;
            this._angularVelocity *= this.friction; // 角速度摩擦
        }

        // 更新位置 (s = v*t)
        const deltaPosition = new Vec3();
        Vec3.multiplyScalar(deltaPosition, new Vec3(this._velocity.x, this._velocity.y, 0), deltaTime);
        this.node.position = this.node.position.add(deltaPosition);

        // 重置力和冲量
        this._force.set(0, 0);
        this._impulse.set(0, 0);

        // 检查是否需要休眠
        this.checkSleepState();
    }

    // 应用力（持续力）
    applyForce(force: Vec2) {
        Vec2.add(this._force, this._force, force);
        this.wakeUp();
    }

    // 应用力到特定点（会产生扭矩）
    applyForceAtPosition(force: Vec2, position: Vec2) {
        this.applyForce(force);

        // 计算扭矩（简化的2D版本）
        const r = Vec2.subtract(new Vec2(), position, new Vec2(this.node.position.x, this.node.position.y));
        const torque = r.cross(force);
        this._angularVelocity += torque * 0.01 / this.mass; // 简化惯性计算
    }

    // 应用冲量（瞬时力）
    applyImpulse(impulse: Vec2) {
        Vec2.add(this._impulse, this._impulse, impulse);
        this.wakeUp();
    }

    // 设置速度
    setVelocity(velocity: Vec2) {
        this._velocity.set(velocity);
        this.wakeUp();
    }

    // 添加速度
    addVelocity(velocity: Vec2) {
        Vec2.add(this._velocity, this._velocity, velocity);
        this.wakeUp();
    }

    // 碰撞响应
    onCollision(collisionNormal: Vec2, restitution: number = 0.5) {
        // 计算法向速度
        const normalSpeed = Vec2.dot(this._velocity, collisionNormal);

        if (normalSpeed < 0) { // 只处理朝向碰撞面的速度
            // 反射速度 v' = v - (1 + restitution) * (v·n) * n
            const reflection = new Vec2();
            Vec2.multiplyScalar(reflection, collisionNormal, (1 + restitution) * normalSpeed);
            Vec2.subtract(this._velocity, this._velocity, reflection);

            // 应用摩擦力
            const tangent = new Vec2(-collisionNormal.y, collisionNormal.x);
            const tangentSpeed = Vec2.dot(this._velocity, tangent);
            Vec2.multiplyScalar(tangent, tangent, tangentSpeed * (1 - this.friction));
            Vec2.subtract(this._velocity, this._velocity, tangent);
        }
    }

    // 约束在区域内
    constrainInArea(minX: number, maxX: number, minY: number, maxY: number) {
        const pos = this.node.position;

        if (pos.x < minX) {
            this.node.setPosition(minX, pos.y, pos.z);
            this._velocity.x = Math.abs(this._velocity.x) * this.friction;
        } else if (pos.x > maxX) {
            this.node.setPosition(maxX, pos.y, pos.z);
            this._velocity.x = -Math.abs(this._velocity.x) * this.friction;
        }

        if (pos.y < minY) {
            this.node.setPosition(pos.x, minY, pos.z);
            this._velocity.y = Math.abs(this._velocity.y) * this.friction;
        } else if (pos.y > maxY) {
            this.node.setPosition(pos.x, maxY, pos.z);
            this._velocity.y = -Math.abs(this._velocity.y) * this.friction;
        }
    }

    // 约束在圆形区域内
    constrainInCircle(center: Vec3, radius: number) {
        const pos = this.node.position;
        const delta = new Vec3();
        Vec3.subtract(delta, pos, center);

        const distance = delta.length();
        if (distance > radius) {
            // 将位置推回边界
            const direction = new Vec3();
            Vec3.normalize(direction, delta);
            Vec3.scaleAndAdd(pos, center, direction, radius * 0.95);
            this.node.position = pos;

            // 反弹效果
            const normal = new Vec2(direction.x, direction.y);
            this.onCollision(normal, 0.3);
        }
    }

    private checkSleepState() {
        const speedSqr = this._velocity.lengthSqr();
        if (speedSqr < this._sleepThreshold) {
            this._isSleeping = true;
            this._velocity.set(0, 0);
            this._angularVelocity = 0;
        }
    }

    private wakeUp() {
        this._isSleeping = false;
    }

    // 工具方法：获取速度大小
    getSpeed(): number {
        return Math.sqrt(this._velocity.x * this._velocity.x + this._velocity.y * this._velocity.y);
    }

    // 工具方法：设置休眠阈值
    setSleepThreshold(threshold: number) {
        this._sleepThreshold = threshold;
    }
}