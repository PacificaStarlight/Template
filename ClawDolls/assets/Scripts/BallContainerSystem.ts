import { _decorator, Component, Node, Vec2 } from 'cc';
import { SimpleRigidBody2D } from './SimpleRigidBody2D';
const { ccclass, property } = _decorator;

@ccclass('BallContainerSystem')
export class BallContainerSystem extends Component {
    @property([Node])
    smallBlocks: Node[] = [];

    @property
    ballRadius: number = 200;

    @property
    innerFriction: number = 0.98;

    private blockRigidBodies: SimpleRigidBody2D[] = [];

    start() {
        // 为每个小方块添加简易刚体
        for (const block of this.smallBlocks) {
            const rigidBody = block.getComponent(SimpleRigidBody2D) || block.addComponent(SimpleRigidBody2D);
            rigidBody.mass = 0.5; // 小质量
            rigidBody.gravity = new Vec2(0, -50); // 弱重力
            rigidBody.linearDamping = this.innerFriction; // 内部摩擦
            rigidBody.friction = 0.9;

            this.blockRigidBodies.push(rigidBody);

            // // 设置随机初始速度
            // const randomVel = new Vec2(
            //     (Math.random() - 0.5) * 100,
            //     (Math.random() - 0.5) * 100
            // );
            // rigidBody.setVelocity(randomVel);
        }
    }

    update(deltaTime: number) {
        const ballPos = this.node.getWorldPosition();

        // // 约束小方块在球内
        // for (const rigidBody of this.blockRigidBodies) {
        //     rigidBody.constrainInCircle(ballPos, this.ballRadius);
        // }
    }

    // 当球移动时，给小方块施加惯性力
    onBallMove(movement: Vec2) {
        for (const rigidBody of this.blockRigidBodies) {
            // 根据质量施加惯性力
            const inertiaForce = new Vec2();
            Vec2.multiplyScalar(inertiaForce, movement, rigidBody.mass * 10);
            rigidBody.applyForce(inertiaForce);
        }
    }
}