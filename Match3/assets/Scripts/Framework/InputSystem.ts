import { _decorator, Component, EventTouch, Node, UITransform, Vec2, Vec3 } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { AudioManager } from './Common/Audio/AudioManager';

const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();
@ccclass('InputSystem')
export class InputSystem extends Component {
    @property({ type: Node, tooltip: '虚拟摇杆节点' })
    private virtualJoystick: Node = null; // 虚拟摇杆节点

    private virtualJoystickBg: Node = null; // 虚拟摇杆节点背景
    private virtualJoystickBtn: Node = null; // 虚拟摇杆按钮节点

    private touchStartPos: Vec2 = null; // 记录触摸开始位置
    private touchEndPos: Vec2 = null; // 记录触摸结束位置
    private moveDir: Vec2 = null; // 移动方向

    private isFirstTouch: boolean = true; // 是否是第一次触摸
    private isMoving: boolean = false;  // 是否在移动

    public static instance: InputSystem = null;

    onLoad() {
        InputSystem.instance = this;
    }
    start() {
        EventManager.on(Constant.EVENT_TYPE.START_LISTEN_TOUCH, this.startLinstener, this);
        EventManager.on(Constant.EVENT_TYPE.CANCEL_LISTEN_TOUCH, this.cancelLinstener, this);
        // this.startLinstener(); // 开始监听输入事件
        this.init(); // 初始化
    }

    onDestroy() {
        this.cancelLinstener(); // 取消监听输入事件
        EventManager.off(Constant.EVENT_TYPE.START_LISTEN_TOUCH, this.startLinstener, this);
        EventManager.off(Constant.EVENT_TYPE.CANCEL_LISTEN_TOUCH, this.cancelLinstener, this);
    }

    /** 初始化 */
    private init() {
        if (this.virtualJoystick) {
            this.virtualJoystick.active = false; // 隐藏虚拟摇杆
            this.virtualJoystickBg = this.virtualJoystick.children[0];
            this.virtualJoystickBtn = this.virtualJoystick.children[1];

            this.resetJoystickPos(); // 虚拟摇杆归位
        } else {
            console.error('虚拟摇杆节点不存在');
            this.node.active = false; // 隐藏节点
        }
    }

    //#region Touch 节点触摸事件
    /** 监听触摸开始事件 */
    private onTouchStart(event: EventTouch) {
        if (GameManager.instance.isGameOver) {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, true);
            return;
        }
        // console.log('触摸开始');
        this.touchStartPos = event.getUILocation(tempV2);
        tempV3.set(this.touchStartPos.x, this.touchStartPos.y, 0);
        // console.log(this.touchStartPos);
        // console.log(this.virtualJoystick.worldPosition);

        this.virtualJoystick.active = true; // 显示虚拟摇杆
        this.virtualJoystick.setWorldPosition(tempV3);

        this.hideGuide();
        // 是否是第一次触摸
        this.playBGM();
    }

    /** 监听触摸移动事件 */
    private onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        // console.log('触摸移动');
        this.touchEndPos = event.getUILocation(tempV2);
        tempV3.set(this.touchEndPos.x, this.touchEndPos.y, 0);

        // 获取摇杆背景的中心位置
        const joystickCenterPos = this.virtualJoystickBg.worldPosition.clone();
        // 计算从摇杆中心到触摸点的向量
        const offsetX = this.touchEndPos.x - joystickCenterPos.x;
        const offsetY = this.touchEndPos.y - joystickCenterPos.y;

        // 获取最大移动半径
        let jsBg = this.virtualJoystickBg;
        const maxRadius = (jsBg.scale.x * jsBg.getComponent(UITransform).width) / 2;
        // 计算距离
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

        // 确定摇杆按钮应该在的位置
        let buttonX, buttonY;
        if (distance <= maxRadius) {
            // 在允许范围内，直接设置到触摸位置
            buttonX = this.touchEndPos.x;
            buttonY = this.touchEndPos.y;
        } else {
            // 超出范围，限制在圆周上
            const ratio = maxRadius / distance;
            buttonX = joystickCenterPos.x + offsetX * ratio;
            buttonY = joystickCenterPos.y + offsetY * ratio;
        }
        // 设置摇杆按钮位置
        tempV3.set(buttonX, buttonY, 0);
        this.virtualJoystickBtn.setWorldPosition(tempV3);

        // 计算移动方向
        this.getMoveDir();

        // 发送移动方向事件给Player脚本
        EventManager.emit(Constant.EVENT_TYPE.PLAYER_MOVE, this.moveDir);
        this.hideGuide();
    }

    /** 监听触摸结束事件 */
    private onTouchEnd(event: EventTouch) {
        this.virtualJoystick.active = false; // 隐藏虚拟摇杆
        if (GameManager.instance.isGameOver) {
            SDKManager.instance.clickDown();
            return;
        }
        // console.log('触摸结束 ');
        this.touchEndPos = event.getUILocation();
        this.resetJoystickPos(); // 虚拟摇杆归位
        EventManager.emit(Constant.EVENT_TYPE.PLAYER_MOVE, new Vec2(0, 0));
    }
    //#endregion

    /** 虚拟摇杆归位 */
    private resetJoystickPos() {
        this.virtualJoystick.active = false; // 隐藏虚拟摇杆
        this.virtualJoystickBg.setPosition(0, 0, 0);
        this.virtualJoystickBtn.setPosition(0, 0, 0);
    }

    /** 获取移动方向 */
    private getMoveDir() {
        let bgPos = this.virtualJoystickBg.position.clone();
        let btnPos = this.virtualJoystickBtn.position.clone();
        this.moveDir = new Vec2(btnPos.x - bgPos.x, btnPos.y - bgPos.y).normalize(); // 获取移动方向
        // console.log(this.moveDir);  // 获取移动方向
    }

    //#region 其他
    /** 播放背景音乐 */
    private playBGM() {
        if (GameManager.instance.gameRunState == Constant.GAME_RUN_STATE.RUNNING) {
            // 是否是第一次触摸
            if (this.isFirstTouch) {
                console.log('播放背景音乐');
                AudioManager.play(Constant.AUDIO_TYPE.BGM); // 播放背景音乐
                this.isFirstTouch = false;
            }
        }
    }

    /** 隐藏引导 */
    private hideGuide() {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, false);     // 显示引导
    }

    /** 开始监听输入事件 */
    private startLinstener() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    /** 取消监听输入事件 */
    private cancelLinstener() {
        EventManager.emit(Constant.EVENT_TYPE.PLAYER_MOVE, new Vec2(0, 0));
        this.virtualJoystick.active = false; // 隐藏虚拟摇杆
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
    //#endregion
}