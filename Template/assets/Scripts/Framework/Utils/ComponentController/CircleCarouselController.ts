import { _decorator, Component, instantiate, Node, tween, Vec3, Animation, CCFloat } from 'cc';
import { EventManager } from '../../Common/Event/EventCenter';
import { Constant } from '../../Constant';

const { ccclass, property } = _decorator;

@ccclass('CircleCarouselController')
export class CircleCarouselController extends Component {
    @property({ type: Node })
    private center: Vec3 = new Vec3(0, -400, 0); // 圆心
    @property({ type: CCFloat })
    private startAngle = 50; // 起始角度50°
    @property({ type: CCFloat })
    private endAngle = -50;  // 结束角度-50°

    private timer: number = 0;
    private interval: number = 3; // 旋转间隔时间
    private curIndex: number = 0; // 当前索引
    private totalAngle: number = 0; // 总角度
    private angleStep: number = 0; // 每个节点之间的角度

    start() {
        this.node.children.forEach((child) => {
            child.active = true;
            child.position = this.center;
        })
        this.layoutNodes();
    }

    update(deltaTime: number) {
        this.timer += deltaTime;
        if (this.timer >= this.interval) {
            this.playIconAnim(); // 播放动画
            this.timer = 0;
        }
    }

    layoutNodes() {
        this.totalAngle = this.startAngle - this.endAngle;
        this.angleStep = this.totalAngle / (this.node.children.length - 1);
        this.node.children.forEach((child, index) => {
            // const radius = this.startAngle - angleStep * index;
            child.angle = this.startAngle - this.angleStep * index; // 设置节点角度
        });
        this.node.children[2].getComponent(Animation).play();
    }

    // 旋转动画：让节点轮流到达顶部（90°位置）
    rotateToNext() {
        console.log('旋转');
        const newNode = instantiate(this.node.children[0]); // 创建新节点
        newNode.angle = this.endAngle - this.angleStep; // 设置新节点角度
        this.node.addChild(newNode); // 添加新节点到圆上
        // 旋转逻辑
        if (this.node.children.length > 0) {
            this.node.children.forEach((child) => {
                tween(child)
                    .to(1, { angle: child.angle + this.angleStep })
                    .start();
            });
            this.scheduleOnce(() => {
                this.node.children[0].destroy();
            }, 0.5); // 等待1秒后删除最底部的节点
        }
    }

    playIconAnim() {
        this.rotateToNext();
        this.scheduleOnce(() => {
            this.node.children[2].getComponent(Animation).play();
        }, 1); // 等待1秒后旋转
        this.scheduleOnce(() => {
            // EventManager.emit(Constant.EVENT_TYPE.CHANGE_SHOW_IMAGE); // 发送游戏切换图片事件
        }, 1.2);

    }
}