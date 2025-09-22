import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform, Button, tween, Size, sp, Collider2D, Contact2DType, ICollisionEvent, PhysicsSystem2D, PolygonCollider2D, view, ITriggerEvent } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant, PLAYER_STATE } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { GuideManager } from './Utils/Guide/GuideManager';
import { AudioManager } from './Common/Audio/AudioManager';
import { CameraController } from './Utils/ComponentController/CameraController';
import { UIManager } from './UIManager';
const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();
@ccclass('InputManager')
export class InputManager extends Component {
    @property(Node)
    private rope: Node = null;  // 绳子
    @property(Node)
    private claw: Node = null;  // 爪子
    @property(Node)
    private claw_Spine: Node = null;

    @property(Button)
    private btnStart: Button = null; // 开始按钮

    @property(Node)
    private moveNode: Node = null; // 移动节点

    private chooseIndex = 0;
    private waitTime: number = 5; // 等待时间
    private hideTime: number = 0; // 隐藏时间
    private ropeLength = 3130;

    private touchStartPos: Vec2 = null; // 记录触摸开始位置
    private startPos: Vec3 = null; // 记录触摸开始位置
    private startParent: Node = null; // 记录触摸开始位置

    /**
     * 默认为false，表示拒绝开始计时，true表示开始计时
     */
    private cd_ShowGuide: boolean = false;
    private isFirstTouch: boolean = true; // 是否是第一次触摸
    private isOver: boolean = false; // 是否结束
    private isMoving: boolean = false; // 是否正在移动

    private swingSpeed: number = 1.5;
    private maxAngle: number = 2;
    private currentAngle: number = 0;
    private direction: number = 1;
    private timer: number = 0;
    private resetTime: number = 0;
    private tempHeight: number = 0;
    private tempPostion: number = 0;
    private gameStartSpeed: number = 3;

    private isPopUp: boolean = false;
    private otherNode: Node = null; // 其他节点

    private ropeState: PLAYER_STATE = PLAYER_STATE.NONE; // 状态
    // 单例模式
    public static instance: InputManager;
    onLoad() {
        InputManager.instance = this; // 单例模式
        // // 监听触摸事件
        // this.startListening();
        EventManager.on(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    start() {
        this.btnStart.transition = Button.Transition.SCALE; // 设置按钮的过渡效果
        this.btnStart.zoomScale = 1.2;  // 设置按钮的缩放比例
        this.btnStart.node.on(Button.EventType.CLICK, this.onBtnStart, this);
        this.btnStart.interactable = false; // 设置按钮不可交互
        let claw = this.claw.getComponent(PolygonCollider2D); // 获取爪子组件
        console.log(claw);

        claw.on(Contact2DType.BEGIN_CONTACT, this.onClawCatch, this);
    }

    onDisable() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    // 初始化块
    public initBlocks() {

    }

    update(deltaTime: number) {
        if (this.cd_ShowGuide) {
            this.hideTime += deltaTime;
            if (this.hideTime > this.waitTime && !this.isOver) {
                this.showGuide();
            }
        }
        if (this.ropeState == PLAYER_STATE.STOP) return;

        if (this.ropeState == PLAYER_STATE.IDLE) {
            // 使用正弦函数实现平滑摆动
            this.timer += deltaTime;
            this.rope.angle = Math.sin(this.timer * this.swingSpeed) * this.maxAngle;
        }

        if (this.ropeState == PLAYER_STATE.FALLING) {
            this.rope.getComponent(UITransform).height += 4;
            this.claw.position = new Vec3(this.claw.position.x, this.claw.position.y - 4, 0);
        }

        if (this.ropeState == PLAYER_STATE.UP) {
            this.resetTime += deltaTime;
            if (this.resetTime <= 1) {
                if (this.rope.getComponent(UITransform).height >= this.tempHeight) {
                    this.rope.getComponent(UITransform).height -= 4;
                    this.claw.position = new Vec3(this.claw.position.x, this.claw.position.y + 4, 0);
                }
            }
            else {
                this.resetTime = 0; // 重置时间
                this.ropeState = PLAYER_STATE.IDLE; // 设置状态为摇摆
                this.btnStart.interactable = true; // 设置按钮可交互
            }
        }

        if (this.ropeState == PLAYER_STATE.MOVEING) {
            if (this.claw.position.y <= -100) {
                this.rope.getComponent(UITransform).height -= this.gameStartSpeed;
                this.claw.position = new Vec3(this.claw.position.x, this.claw.position.y + this.gameStartSpeed, 0);

                let layoutTop = CameraController.instance.UI_LayoutTop;
                layoutTop.position = new Vec3(layoutTop.position.x, layoutTop.position.y + this.gameStartSpeed, 0);
                let camera = CameraController.instance.mainCamera; // 获取主摄像机
                camera.node.position = new Vec3(0, camera.node.position.y + this.gameStartSpeed, camera.node.position.z);
            }
        }
    }

    /** 抓到物体 */
    private onClawCatch(self: Collider2D, other: Collider2D, event: ICollisionEvent) {
        console.log('抓到-----------------------------------------------------');
        console.log(self.name, other.name, event);
        // AudioManager.play('catch');
        this.ropeState = PLAYER_STATE.STOP; // 设置状态为停止
        let offsetX = self.node.worldPosition.x - other.node.worldPosition.x;
        if (Math.abs(offsetX) > 10) {
            console.log('没有抓到物体' + offsetX);
            this.scheduleOnce(() => {
                this.claw.angle = 0; // 设置爪子角度为0
                this.ropeState = PLAYER_STATE.UP; // 设置状态为下落
            }, 0.5);  // 设置状态为下落
        }
        else {
            console.log('抓到物体' + offsetX);
            this.otherNode = other.node;
            tween(this.claw.children[0])
                .to(0.2, { angle: 0 }) // 旋转到0度
                .start();
            tween(this.claw.children[2])
                .to(0.2, { angle: 0 }) // 旋转到0度
                .start();
            this.scheduleOnce(() => {
                this.claw.angle = 0; // 设置爪子角度为0
                other.node.setParent(this.claw.children[1]); // 设置物体为爪子的子节点
                other.node.setPosition(0, 0); // 设置物体位置为0,0
                this.btnStart.interactable = false; // 设置按钮不可交互
                this.onReady(); // 开始动画
            }, 0.1); // 设置状态为下落
        }
    }

    /** 开始动画 */
    public startAnim(stopDelay: number = 1, duration: number = 1) {
        tween(this.claw_Spine)
            .delay(stopDelay)
            .call(() => {
                this.claw_Spine.active = true;
                let skeleton = this.claw_Spine.getComponent(sp.Skeleton);
                skeleton.setAnimation(0, 'idle', false); // 播放动画
                skeleton.setCompleteListener(() => {
                    this.claw_Spine.active = false;
                    this.rope.active = true;
                });
            })
            .start();


        let ropeHeight = this.rope.getComponent(UITransform).height + this.ropeLength;  // 计算绳子的高度
        let clawHight = this.claw.position.clone().y - this.ropeLength; // 记录爪子的高度
        tween(this.rope.getComponent(UITransform))
            .delay(stopDelay)
            .to(duration, { contentSize: new Size(this.rope.getComponent(UITransform).width, ropeHeight) }, { easing: 'quadInOut' })
            .delay(stopDelay)
            .call(() => {
                tween(this.claw.children[0])
                    .to(1, { angle: -10 })
                    .start();
                tween(this.claw.children[2])
                    .to(1, { angle: 10 })
                    .call(() => {
                        this.ropeState = PLAYER_STATE.IDLE; // 设置状态为摇摆
                        this.btnStart.interactable = true; // 设置按钮可交互
                        console.log('摇摆');
                    })
                    .start();
            })
            .start();
        tween(this.claw)
            .delay(stopDelay)
            .to(duration, { position: new Vec3(this.claw.position.x, clawHight) }, { easing: 'quadInOut' })
            .start();
    }

    /** 准备阶段 */
    private onReady() {
        tween(this.rope)
            .to(0.1, { angle: 0 })
            .start();
        tween(this.rope.getComponent(UITransform))
            .to(0.5, { contentSize: new Size(this.rope.getComponent(UITransform).contentSize.width, this.tempHeight) })
            .start();
        tween(this.claw)
            .to(0.5, { position: new Vec3(this.claw.position.x, this.tempPostion) })
            .start();
        tween(CameraController.instance.mainCamera.node)
            .to(0.5, { position: this.claw.children[1].position.clone().add(new Vec3(0, 100, 0)) })
            .call(() => {
                UIManager.instance.UI_GuidePopUp.active = true; // 显示引导
                this.isPopUp = true; // 设置引导状态
            })
            .start();
        this.startListening(); // 开始监听触摸事件
        this.claw.getComponent(PolygonCollider2D).off(Contact2DType.BEGIN_CONTACT, this.onClawCatch, this);
        console.log(this.otherNode.name);
        this.otherNode.getComponent(Collider2D).on('onTriggerEnter', this.onColliderTouch, this);
    }

    /** 开始监听触摸事件 */
    public onBtnStart() {
        console.log('开始游戏');
        this.btnStart.interactable = false;
        this.tempHeight = this.rope.getComponent(UITransform).height;
        this.tempPostion = this.claw.position.clone().y;
        this.ropeState = PLAYER_STATE.FALLING; // 设置状态为下落
        console.log('下落');
        this.tempPostion = this.claw.position.clone().y;
        this.tempHeight = this.rope.getComponent(UITransform).height;

        // this.scheduleOnce(() => {
        //     this.ropeState = PLAYER_STATE.UP; // 设置状态为上升
        //     console.log('上升');
        // }, 1);
        // this.scheduleOnce(() => {
        //     this.ropeState = PLAYER_STATE.IDLE; // 设置状态为摇摆
        // }, 2);
    }

    private onColliderTouch(other: Collider2D, self: Collider2D, event: ITriggerEvent) {
        console.log(self.name + " " + other.name + ' ' + event); // 打印碰撞信息
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch) {
        // console.log('开始触摸');
        this.touchStartPos = event.getLocation();
        this.hideTime = 0;
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        if (this.isPopUp) {
            this.isPopUp = false;
            UIManager.instance.UI_GuidePopUp.active = false; // 隐藏引导
            this.ropeState = PLAYER_STATE.MOVEING; // 设置状态为移动
        }

        this.hideGuide(); // 隐藏引导

        this.onStartDrag(); // 开始拖动
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        // console.log('触摸移动');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        const startPos = this.touchStartPos;
        const movePos = event.getLocation();

        console.log(startPos, movePos);
        const diatanceX = Math.abs(movePos.x - startPos.x);
        const diatancey = Math.abs(movePos.y - startPos.y);
        if (diatanceX > 10 || diatancey > 10) {
            console.log('滑动');
            let rowDis = movePos.x - startPos.x;

            // 基于滑动距离和屏幕尺寸计算角度
            // const { width: screenWidth } = view.getVisibleSize();
            // // 假设屏幕一半宽度对应最大旋转角度
            // const maxRotationAngle = 180; // 最大旋转角度
            // const normalizedDistance = rowDis / (screenWidth * 0.5);
            // const clampedDistance = Math.max(-1, Math.min(1, normalizedDistance));
            // const rotationAngle = clampedDistance * maxRotationAngle * 0.01;

            // 设定一个转换系数，比如每10像素对应1度旋转
            const angleFactor = 0.1; // 调整这个值来改变灵敏度
            const rotationAngle = rowDis * angleFactor;
            console.log('旋转角度：', rotationAngle);

            console.log('偏移量角度：', rotationAngle, this.ropeState);
            this.rope.angle = rotationAngle;
            // // 判断触摸方向
            // if (rowDis <= 0) {
            //     console.log('向左滑动');
            //     this.rope.angle -= Math.abs(clampedAngle);
            // }
            // else if (rowDis > 0) {
            //     console.log('向右滑动');
            //     this.rope.angle += Math.abs(clampedAngle);
            // }
        }
        this.hideGuide(); // 隐藏引导
        this.onStartDrag(); // 开始拖动
    }

    // 触摸结束事件
    private onTouchEnd(event: EventTouch) {
        if (GameManager.instance.isGameOver) {
            SDKManager.instance.clickDown();
            return;
        }

        // console.log('触摸结束 ');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.touchStartPos = null;

        /** 计算屏幕移动方向或者距离 */
        /* const startPos = this.touchStartPos;
        const endPos = event.getLocation();

        console.log(startPos, endPos);
        const diatanceX = Math.abs(endPos.x - startPos.x);
        const diatancey = Math.abs(endPos.y - startPos.y);
        if (diatanceX > 10 || diatancey > 10) {
            console.log('滑动');
            let rowDis = endPos.x - startPos.x;
            let colDis = endPos.y - startPos.y;
            // 判断触摸方向
            if (Math.abs(rowDis) >= Math.abs(colDis)) {
                if (rowDis <= -100) {
                    console.log('向左滑动');
                }
                else if (rowDis > 100) {
                    console.log('向右滑动');
                }
            } else {
                if (colDis > 100) {
                    console.log('向上滑动');
                }
                else if (colDis <= -100) {
                    console.log('向下滑动');
                }
            }
        }
        else {
            console.log('点击 ');
        }
        */

        this.onFinishDrag(); // 结束拖动

        // 是否是第一次触摸
        if (this.isFirstTouch) {
            AudioManager.play(Constant.AUDIO_TYPE.BGM); // 播放背景音乐
            this.isFirstTouch = false;
        }

        // 显示引导
        if (!this.cd_ShowGuide) {
            EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE);     // 显示引导
            this.cd_ShowGuide = true;
        }
        this.hideTime = 0;
    }

    // 开始拖动
    private onStartDrag() {
        if (this.isMoving) return;
        // let targetBlock = this.block; // 获取块
        // if (this.curChooseNode == null) {
        //     for (let i = 0; i < targetBlock.length; i++) {
        //         const block = targetBlock[i];
        //         const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 判断是否包含块
        //         if (isContain) {
        //             this.curChooseNode = block;
        //             // console.log('已选中的块 ' + this.curChooseNode.name);
        //             AudioManager.playOneShot(Constant.AUDIO_TYPE.TIP_SFX_DU);// 播放音效
        //             break;
        //         }
        //     }
        // }
        // else {
        //     console.log('移动已选中的块 ' + this.curChooseNode.name);
        //     this.curChooseNode.setWorldPosition(tempV3);
        // }
    }

    // 结束拖动
    private onFinishDrag() {
        // const targetBlock = this.block; // 获取块
        // const targetBoard = this.board; // 获取板子
        // // 块节点
        // if (this.lateChooseNode == null) {
        //     for (let i = 0; i < targetBlock.length; i++) {
        //         if (i == this.chooseIndex) continue;
        //         const block = targetBlock[i];
        //         const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 获取块的位置
        //         if (isContain) {
        //             this.lateChooseNode = block;
        //             console.log('被选中的块： ' + this.lateChooseNode.name);
        //             if (false) {
        //             }
        //             else {
        //                 console.log('拒绝移动');
        //                 AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
        //             }
        //         }
        //     }
        // }
        //     // 拖动结束后的逻辑，把拖动的方块移动到正确的位置        
        //     if(this.curChooseNode != null) {
        //     this.moveBlock(this.startParent, this.startPos);
        // }
    }

    // 移动块
    private moveBlock(newParent: Node, newPos: Vec3) {

    }


    // 移动成功
    private moveSuccess() {
        // this.curChooseNode.getComponent(Animation).play(); // 播放移动失败动画
        AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS); // 播放移动失败音效
    }

    // 移动失败
    private moveFailed() {
        // this.curChooseNode.getComponent(Animation).play(); // 播放移动失败动画
        AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
    }

    /** 游戏结束 */
    private gameOver(isWin: boolean = false) {
        this.hideTime = 0;
        this.cancelListening(); // 取消监听
        this.scheduleOnce(() => {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }, 0.5);
    }

    /** 显示引导 */
    private showGuide() {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, true);
        console.log('打开引导UI');
        this.cd_ShowGuide = false;        // 设置为false，表示打开引导UI
        this.hideTime = 0;
    }

    /** 隐藏引导 */
    private hideGuide() {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, false);     // 显示引导
        this.cd_ShowGuide = true;
        this.hideTime = 0;
    }

    /** 开始监听全局触摸事件 */
    public startListening() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /** 取消监听全局触摸事件 */
    public cancelListening() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}