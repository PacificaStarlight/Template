import { _decorator, Collider2D, Contact2DType, Component, Node, UITransform, Animation } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('Player')
export class Player extends Component {
    @property(Node)
    public player: Node = null;
    @property(Node)
    public playerCollider: Node = null;


    start() {
        this.init();
        // 监听触发事件
        let collider = this.playerCollider.getComponent(Collider2D);
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);    // 监听碰撞开始事件
    }

    // 初始化
    init() {

    }

    update(deltaTime: number) {
        if (GameManager.instance.isGameOver) return; // 游戏结束

    }

    onDestroy() {

    }

    // 碰撞检测
    onBeginContact(self: Collider2D, other: Collider2D, contact: any) {
        console.log(self.name + " " + other.name);
    }

    private gameOver() {
        GameManager.instance.isGameOver = true;
    }
}