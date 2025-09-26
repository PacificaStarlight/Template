import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform, Button, tween, Size, sp, Collider2D, Contact2DType, PolygonCollider2D, view, ITriggerEvent, CircleCollider2D, instantiate, RigidBody2D, AnimationComponent, Animation, } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant, PLAYER_STATE } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { AudioManager } from './Common/Audio/AudioManager';
import { CameraController } from './Utils/ComponentController/CameraController';
import { UIManager } from './UIManager';
import { Tools } from './Utils/Tools';
import { SuccessEffect } from '../SuccessEffect';
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
    @property(Node)
    private boardBg: Node = null;

    @property(Button)
    private btnStart: Button = null; // 开始按钮

    @property([Node])
    private scrollViewList: Node[] = []; // 

    private chooseIndex = 0;
    private waitTime: number = 5; // 等待时间
    private hideTime: number = 0; // 隐藏时间
    private ropeLength = 3130;

    private minX: number = 0;
    private maxX: number = 0;
    private countNum: number = 4; // 计数器
    private force = 0.1; // 力度

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
    private isPopUp: boolean = false;
    private isHadProtect: boolean = false; // 是否有保护
    private isLeft: boolean = false;    // 是否是向左
    private isRight: boolean = false;   // 是否是向右
    private isRestart: boolean = false; // 是否是重新开始

    private isCanMove: boolean = true; // 是否可以移动

    private swingSpeed: number = 1.5;
    private maxAngle: number = 2;
    private currentAngle: number = 0;
    private direction: number = 1;
    private timer: number = 0;
    private resetTime: number = 0;
    private tempHeight: number = 0;
    private tempPostion: number = 0;
    private gameStartSpeed: number = 3;
    private gameCameraSpeedH: number = 3;
    private gameCameraSpeedV: number = 2.7;

    private clickCount: number = 3; // 点击次数

    private array: Array<Node> = [];

    private otherNode: Node = null; // 其他节点
    private ropeState: PLAYER_STATE = PLAYER_STATE.NONE; // 状态
    // 单例模式
    public static instance: InputManager;
    onLoad() {
        InputManager.instance = this; // 单例模式
        EventManager.on(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
        this.startListening(); // 开始监听
    }

    start() {
        this.btnStart.transition = Button.Transition.SCALE; // 设置按钮的过渡效果
        this.btnStart.zoomScale = 1.2;  // 设置按钮的缩放比例
        this.btnStart.node.on(Button.EventType.CLICK, this.onBtnStart, this);
        this.btnStart.interactable = false; // 设置按钮不可交互
        let claw = this.claw.getComponent(PolygonCollider2D); // 获取爪子组件
        claw.on(Contact2DType.BEGIN_CONTACT, this.onClawCatch, this);
        this.initBlocks(this.boardBg);
    }

    onDisable() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    // 初始化块
    public initBlocks(node: Node) {
        let bound = Tools.getImageRange(node); // 获取节点在屏幕上的范围
        if (this.claw.children[1] != null) {
            let block = this.claw.children[1].getComponent(UITransform);
            this.minX = bound.left + block.width / 2;
            this.maxX = bound.right - block.width / 2;
        }
        else {
            console.log(bound);
            this.minX = bound.left + 60;
            this.maxX = bound.right - 60;
        }
    }

    update(deltaTime: number) {
        if (this.cd_ShowGuide) {
            this.hideTime += deltaTime;
            if (this.hideTime > this.waitTime && !this.isOver) {
                this.showGuide();
            }
        }
        if (this.ropeState == PLAYER_STATE.STOP) return;

        /** 摆动 */
        if (this.ropeState == PLAYER_STATE.IDLE) {
            // 使用正弦函数实现平滑摆动
            this.timer += deltaTime;
            this.rope.angle = Math.sin(this.timer * this.swingSpeed) * this.maxAngle;
        }

        /** 下降 */
        if (this.ropeState == PLAYER_STATE.FALLING) {
            this.rope.getComponent(UITransform).height += 4;
            this.claw.position = new Vec3(this.claw.position.x, this.claw.position.y - 4, 0);
        }

        /** 弹起 */
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
                if (this.clickCount >= 0) {
                    this.ropeState = PLAYER_STATE.IDLE; // 设置状态为摇摆
                    this.btnStart.interactable = true; // 设置按钮可交互
                } else {
                    this.gameOver(false);
                    this.ropeState = PLAYER_STATE.STOP;
                    return;
                }
            }
        }

        if (this.ropeState == PLAYER_STATE.MOVEING) {
            if (this.claw.position.y <= -100) {
                this.rope.getComponent(UITransform).height -= this.gameStartSpeed;
                this.claw.position = new Vec3(this.claw.position.x, this.claw.position.y + this.gameStartSpeed, 0);

                let speed = this.gameCameraSpeedH;
                if (GameManager.instance.isLandscape) {
                    speed = this.gameCameraSpeedV;
                }

                let layoutTop = CameraController.instance.UI_LayoutTop;
                layoutTop.position = new Vec3(layoutTop.position.x, layoutTop.position.y + speed, 0);
                let camera = CameraController.instance.mainCamera; // 获取主摄像机
                camera.node.position = new Vec3(0, camera.node.position.y + speed, camera.node.position.z);
            }
            else {
                this.ropeState = PLAYER_STATE.STOP;
                this.gameOver(true);
            }
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
        this.tempHeight = ropeHeight;
        this.tempPostion = clawHight; // 记录爪子的位置
        this.moveClaw(stopDelay, duration);
    }

    /** 移动爪子到底部 */
    private moveClaw(stopDelay: number = 1, duration: number = 1) {
        tween(this.rope.getComponent(UITransform))
            .delay(stopDelay)
            .to(duration, { contentSize: new Size(this.rope.getComponent(UITransform).width, this.tempHeight) }, { easing: 'quadInOut' })
            .delay(stopDelay)
            .call(() => {
                tween(this.claw.children[0])
                    .to(0.5, { angle: -10 })
                    .start();
                tween(this.claw.children[2])
                    .to(0.5, { angle: 10 })
                    .start();
            })
            .start();
        tween(this.claw)
            .delay(stopDelay)
            .to(duration, { position: new Vec3(this.claw.position.x, this.tempPostion) }, { easing: 'quadInOut' })
            .delay(1)
            .call(() => {
                this.btnStart.interactable = true; // 设置按钮可交互
                this.otherNode = null;
                let claw = this.claw.getComponent(PolygonCollider2D); // 获取爪子组件
                claw.on(Contact2DType.BEGIN_CONTACT, this.onClawCatch, this); // 监听碰撞事件
                this.ropeState = PLAYER_STATE.IDLE; // 设置状态为摇摆
                this.timer = 0;
            })
            .start();
    }

    /** 准备阶段 */
    private onReady() {
        console.log(this.tempHeight);
        tween(this.rope)
            .to(0.3, { angle: 0 })
            .start();
        let ropeContent = this.rope.getComponent(UITransform).contentSize;
        tween(this.rope.getComponent(UITransform))
            .to(0.3, { contentSize: new Size(ropeContent.width, this.tempHeight - 100) })
            .start();
        tween(this.claw)
            .to(0.3, { position: new Vec3(this.claw.position.x, this.tempPostion + 100) })
            .start();

        let camera = CameraController.instance.mainCamera.node;
        let layoutTop = CameraController.instance.UI_LayoutTop; // 获取UI布局节点
        let offest = this.claw.worldPosition.clone().y - camera.worldPosition.y;
        tween(camera)
            .to(0.3, {
                worldPosition: new Vec3(
                    camera.worldPosition.x,
                    this.claw.worldPosition.clone().y,
                    camera.worldPosition.z)
            })  // 设置摄像机位置为爪子位置
            .call(() => {
                UIManager.instance.UI_GuidePopUp.active = true; // 显示引导
                // this.startListening(); // 开始监听触摸事件
                this.isMoving = true; // 设置移动状态
                this.isPopUp = true; // 设置引导状态
            })
            .start();

        tween(layoutTop)
            .to(0.3, {
                worldPosition: new Vec3(layoutTop.worldPosition.x, layoutTop.worldPosition.y + offest, layoutTop.worldPosition.z)
            })
            .start();
    }

    /** 开始监听触摸事件 */
    public onBtnStart() {
        console.log('开始游戏');
        this.hideGuide(); // 隐藏引导
        this.playBGM(); // 播放背景音乐
        this.btnStart.interactable = false;
        this.ropeState = PLAYER_STATE.FALLING; // 设置状态为下落
        this.initBlocks(this.boardBg); // 初始化方块
        this.isRestart = false; // 重置状态
        AudioManager.playOneShot(Constant.AUDIO_TYPE.TIP_SFX_DU);
        this.clickCount--;
        console.log('点击次数：', this.clickCount);
    }

    /** 碰撞监听：抓到物体 */
    private onClawCatch(self: Collider2D, other: Collider2D) {
        // console.log('抓到-----------------------------------------------------');
        console.log(self.name, other.name);
        // AudioManager.play('catch');
        this.ropeState = PLAYER_STATE.STOP; // 设置状态为停止
        let offsetX = self.node.worldPosition.x - other.node.worldPosition.x;
        if (Math.abs(offsetX) > 12) {
            console.log('没有抓到物体' + offsetX);
            if (this.clickCount == 0) {
                this.gameOver(false);
            }

            this.scheduleOnce(() => {
                this.claw.angle = 0; // 设置爪子角度为0
                this.ropeState = PLAYER_STATE.UP; // 设置状态为下落
            }, 0.5);  // 设置状态为下落
        }
        else {
            console.log('抓到物体' + offsetX);
            this.btnStart.interactable = false; // 设置按钮不可交互
            this.otherNode = other.node;
            this.claw.getComponent(PolygonCollider2D).off(Contact2DType.BEGIN_CONTACT, this.onClawCatch, this);
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
                this.onReady(); // 准备阶段
            }, 0.1); // 设置状态为下落

        }
    }

    // 爪子旋转
    private rotateClaw(dis: number) {
        // 基于绳子长度动态计算角度因子
        const ropeHeight = this.rope.getComponent(UITransform).height;
        // 根据绳子长度计算角度因子，绳子越长，相同滑动距离造成的角度变化越小
        const angleFactor = 0.02 * (3140 / ropeHeight); // 300为参考长度
        let rotationAngle = dis * 0.3 * angleFactor;
        let clawPos = this.claw.children[1].worldPosition;

        this.rope.angle += rotationAngle;
        if (clawPos.x >= this.minX && clawPos.x <= this.maxX) {
            this.rope.angle += rotationAngle;
        }
        if (clawPos.x >= this.maxX) {
            let tempDis = (clawPos.x - this.maxX) * angleFactor;
            this.rope.angle -= tempDis;
        }
        if (clawPos.x <= this.minX) {
            let tempDis = (clawPos.x - this.minX) * angleFactor;
            this.rope.angle -= tempDis;
        }
    }

    /** 触摸事件开始 */
    private onTriggerTouch(self: Collider2D, other: Collider2D) {
        let number = this.claw.children[1].children[0].children[0].children.length;
        let temp = this.claw.children[1].children[0].children[0].children;// 获取第一个子节点
        // // 检查是否已经处理过该碰撞
        if (this.array.indexOf(other.node) != -1) return;
        if (other.tag == 8) {
            console.log('围栏');
            let distance = self.node.worldPosition.x - other.node.worldPosition.x; // 计算距离
            // this.ropeState = PLAYER_STATE.STOP; // 设置状态为停止
            if (Math.abs(distance) > 25) {
                if (distance > 0) {
                    console.log('向右移动');
                    this.isLeft = false;
                    this.isRight = true;
                    this.isCanMove = false;
                }
                else {
                    console.log('向左移动');
                    this.isLeft = true;
                    this.isRight = false;
                    this.isCanMove = false;
                }
            }
            else {
                if (!this.isHadProtect) {
                    this.ropeState = PLAYER_STATE.STOP; // 设置状态为停止
                    this.restart();
                    AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
                }
                else {
                    self.node.getComponent(RigidBody2D).enabledContactListener = false; // 禁用碰撞监听器
                    let image = this.claw.children[1].children[0].children[5];
                    image.getComponent(sp.Skeleton).clearTrack(1); // 清除所有轨道
                    image.active = false;
                    AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
                }
            }
        }

        if (other.tag != 8) {
            this.array.push(other.node);
        }

        // 标记为已处理
        // console.log('碰撞开始' + self.name + " " + other.name); // 打印碰撞信息
        if (other.tag == 1) {
            console.log('尖刺');
            console.log(this.isHadProtect);
            if (!this.isHadProtect) {
                this.ropeState = PLAYER_STATE.STOP;
                this.restart();
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
            }
            else {
                AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
            }
        }
        else if (other.tag == 2) {
            console.log('X2');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = this.countNum * 2;
            if (num >= number) {
                num = number;
            }
            console.log(num);
            for (let i = this.countNum - 1; i < num; i++) {
                temp[i].getComponent(PolygonCollider2D).enabled = true;
                this.scheduleOnce(() => {
                    temp[i].getComponent(RigidBody2D).enabled = true;
                    temp[i].active = true;
                }, 0.1);
            }
            this.countNum = num;
            let image = this.claw.children[1].children[0].children[3];
            image.active = true;
            image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // 当动画播完时
            image.getComponent(sp.Skeleton).setCompleteListener(() => {
                image.active = false;
                image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        }
        else if (other.tag == 3) {
            console.log('/2');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = Math.floor(this.countNum / 2);
            if (num < 2) {
                num = 2;
            }
            console.log(num);
            for (let i = number - 1; i >= num; i--) {
                temp[i].getComponent(PolygonCollider2D).enabled = false;
                this.scheduleOnce(() => {
                    temp[i].getComponent(RigidBody2D).enabled = false;
                }, i * 0.01);
                this.scheduleOnce(() => {
                    temp[i].active = false;
                }, 0.02 * i);
            }
            this.countNum = num;
            console.log(this.countNum);
            // let image = this.claw.children[1].children[0].children[4];
            // image.active = true;
            // image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // // 当动画播完时
            // image.getComponent(sp.Skeleton).setCompleteListener(() => {
            //     image.active = false;
            //     image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            // });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
        }
        else if (other.tag == 4) {
            console.log('伤害');
            console.log(this.isHadProtect);
            if (!this.isHadProtect) {
                this.ropeState = PLAYER_STATE.STOP;
                this.cancelListening(); // 取消监听触摸事件
                this.restart();
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
            } else {
                AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
            }
        }
        else if (other.tag == 5) {
            console.log('X5');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = this.countNum * 5;
            if (num >= number) {
                num = number;
            }
            console.log(num);
            for (let i = this.countNum - 1; i < num; i++) {
                temp[i].getComponent(PolygonCollider2D).enabled = true;
                this.scheduleOnce(() => {
                    temp[i].getComponent(RigidBody2D).enabled = true;
                    temp[i].active = true;
                }, 0.1);
            }
            this.countNum = num;
            let image = this.claw.children[1].children[0].children[3];
            image.active = true;
            image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // 当动画播完时
            image.getComponent(sp.Skeleton).setCompleteListener(() => {
                image.active = false;
                image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        }
        else if (other.tag == 6) {
            console.log('/5');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = Math.floor(this.countNum / 5);
            if (num < 2) {
                num = 2;
            }
            console.log(num);
            for (let i = number - 1; i >= num; i--) {
                temp[i].getComponent(PolygonCollider2D).enabled = false;
                this.scheduleOnce(() => {
                    temp[i].getComponent(RigidBody2D).enabled = false;
                }, i * 0.01);
                this.scheduleOnce(() => {
                    temp[i].active = false;
                }, 0.02 * i);
            }
            this.countNum = num;
            console.log(this.countNum);
            // let image = this.claw.children[1].children[0].children[4];
            // image.active = true;
            // image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // // 当动画播完时
            // image.getComponent(sp.Skeleton).setCompleteListener(() => {
            //     image.active = false;
            //     image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            // });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
        }
        else if (other.tag == 7) {
            console.log('护盾');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            this.isHadProtect = true; // 设置护盾状态
            console.log(this.isHadProtect);
            let image = this.claw.children[1].children[0].children[5];
            image.active = true;
            image.getComponent(sp.Skeleton).addAnimation(1, 'idle', true);
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        }
        else if (other.tag == 9) {
            console.log('X10');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = number;
            console.log(num);
            for (let i = this.countNum - 1; i < num; i++) {
                let cd = temp[i].getComponent(PolygonCollider2D);
                let rb = temp[i].getComponent(RigidBody2D);
                if (cd && rb) {
                    cd.enabled = true;
                    this.scheduleOnce(() => {
                        rb.enabled = true;
                        temp[i].active = true;
                    }, 0.1);
                }
            }
            this.countNum = num;
            let image = this.claw.children[1].children[0].children[3];
            image.active = true;
            image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // 当动画播完时
            image.getComponent(sp.Skeleton).setCompleteListener(() => {
                image.active = false;
                image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        }
        else if (other.tag == 10) {
            console.log('X10');
            this.initBlocks(other.node);    // ---------------------------------------------------确定新边界
            let num = number;
            console.log(num);
            for (let i = this.countNum - 1; i < num; i++) {
                let cd = temp[i].getComponent(PolygonCollider2D);
                let rb = temp[i].getComponent(RigidBody2D);
                if (cd && rb) {
                    cd.enabled = true;
                    this.scheduleOnce(() => {
                        rb.enabled = true;
                        temp[i].active = true;
                    }, 0.1);
                }
            }
            this.countNum = num;
            let image = this.claw.children[1].children[0].children[3];
            image.active = true;
            image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            this.claw.children[1].children[0].children[4].active = false;
            image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);
            // 当动画播完时
            image.getComponent(sp.Skeleton).setCompleteListener(() => {
                image.active = false;
                image.getComponent(sp.Skeleton).clearTrack(0); // 清除所有轨道
            });
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        }
    }

    /** 触摸事件结束 */
    private onTriggerEnd(self: Collider2D, other: Collider2D) {
        // console.log(self.name + " " + other.name);
        if (other.tag == 8) {

            if (self.node.worldPosition.y - other.node.worldPosition.y > self.node.getComponent(UITransform).height / 2) {
                // this.ropeState = PLAYER_STATE.STOP; // 停止移动
                console.log('穿过围栏了-----------------------------------------');
                this.isCanMove = true;
            }
        }
        if (other.tag == 1 || other.tag == 4 || other.tag == 8) {
            this.isHadProtect = false; // 取消护盾状态
            let image = this.claw.children[1].children[0].children[5];
            image.getComponent(sp.Skeleton).clearTrack(1); // 清除所有轨道
            image.active = false;
        }
        this.isLeft = false;
        this.isRight = false;
        this.initBlocks(this.boardBg);    // ---------------------------------------------------确定新边界
    }

    /** 重新开始游戏 */
    private restart() {
        console.log('重新开始');
        if (this.isRestart) return;
        if (this.clickCount == 0) {
            this.gameOver(false);
            this.ropeState = PLAYER_STATE.STOP;
            return;
        }
        this.initBlocks(this.boardBg);    // ---------------------------------------------------确定新边界
        this.isRestart = true;
        // this.cancelListening(); // 取消监听触摸事件
        this.isMoving = false; // 停止移动

        this.claw.children[1].children[0].children[1].active = false;
        let image = this.claw.children[1].children[0].children[2]
        image.active = true;
        image.getComponent(sp.Skeleton).addAnimation(0, 'idle', false);

        // this.claw.children[1].children[0].children[0].children.forEach(item => {
        //     item.getComponent(PolygonCollider2D).sensor = true;
        // });

        console.log(this.claw.children[1].children[0].name);
        this.claw.children[1].children[0].getComponent(PolygonCollider2D).enabled = false;
        this.applyInertiaForce(new Vec2(1, 0), true); // 清除惯性力

        this.scheduleOnce(() => {
            UIManager.instance.failNode.active = true; // 显示失败界面
            UIManager.instance.failNode.getComponent(Animation).play();
        }, 0.5);

        this.scheduleOnce(() => {
            UIManager.instance.failNode.active = false;
            if (this.claw.children[1].children[0] != null) {
                this.claw.children[1].destroyAllChildren(); // 销毁物体
            }
            this.isLeft = false;
            this.isRight = false;
            this.array = [];
            this.countNum = 4;
            tween(this.rope)
                .to(0.3, { angle: 0 })
                .call(() => {
                    this.moveClaw(0.5, 0.5);
                    CameraController.instance.moveCamera(0.5, 0.5);
                })
                .start();
        }, 3);
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch) {
        console.log('开始触摸');
        this.touchStartPos = event.getLocation();
        this.hideTime = 0;
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.hideGuide(); // 隐藏引导
        // this.onStartDrag(); // 开始拖动
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        if (!this.isMoving) return;
        // console.log('触摸移动');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        const startPos = this.touchStartPos;
        const movePos = event.getLocation();
        let rowDis = movePos.x - startPos.x;

        this.rotateClaw(rowDis);
        if (rowDis > 0) {
            this.applyInertiaForce(new Vec2(this.force, 0));
        }
        else if (rowDis < 0) {
            this.applyInertiaForce(new Vec2(-this.force, 0));
        }

        this.touchStartPos = event.getLocation(); // 更新触摸起始位置
        this.hideGuide(); // 隐藏引导

        // this.onStartDrag(); // 开始拖动
    }

    // 触摸结束事件
    private onTouchEnd(event: EventTouch) {
        if (GameManager.instance.isGameOver) {
            SDKManager.instance.clickDown();
            return;
        }
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.touchStartPos = null;

        if (this.isPopUp) {
            this.isPopUp = false;
            UIManager.instance.UI_GuidePopUp.active = false; // 隐藏引导
            this.ropeState = PLAYER_STATE.MOVEING; // 设置状态为移动
            this.otherNode.getComponent(PolygonCollider2D).sensor = true; // 设置为传感器
            this.otherNode.getComponent(PolygonCollider2D).on(Contact2DType.BEGIN_CONTACT, this.onTriggerTouch, this);
            this.otherNode.getComponent(PolygonCollider2D).on(Contact2DType.END_CONTACT, this.onTriggerEnd, this);
        }
        // 是否是第一次触摸
        this.playBGM(); // 播放背景音乐

        // 显示引导
        if (!this.cd_ShowGuide) {
            console.log('显示引导');
            EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE);     // 显示引导
            this.cd_ShowGuide = true;
        }
        this.hideTime = 0;
    }

    /** 对物体施加惯性力 */
    private applyInertiaForce(force: Vec2 = new Vec2(0, 100), isBound: boolean = false) {
        let temp = this.claw.children[1].children[0].children[0].children; // 获取物体
        if (isBound) {
            for (let i = 0; i < temp.length; i++) {
                let random = Math.random() * 2 - 1;
                let inertiaForce = new Vec2(force.x * random, force.y * random * 0.5);
                const worldPos = temp[i].worldPosition;
                const impulsePos = new Vec2(worldPos.x, worldPos.y);
                temp[i].getComponent(RigidBody2D).applyLinearImpulse(inertiaForce, impulsePos, true); // 施加惯性力
            }
        } else {
            for (let i = 0; i < temp.length; i++) {
                const worldPos = temp[i].worldPosition;
                const impulsePos = new Vec2(worldPos.x, worldPos.y);
                temp[i].getComponent(RigidBody2D).applyLinearImpulse(force, impulsePos, true); // 施加惯性力
            }
        }

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
        console.log('游戏结束');
        this.cancelListening(); // 取消监听
        if (isWin) {
            this.otherNode.getComponent(PolygonCollider2D).off(Contact2DType.BEGIN_CONTACT, this.onTriggerTouch, this);
            this.otherNode.getComponent(PolygonCollider2D).off(Contact2DType.END_CONTACT, this.onTriggerEnd, this);
            this.otherNode.children[0].children.forEach(element => {
                element.getComponent(RigidBody2D).enabled = false; // 禁用刚体
            });

            this.scheduleOnce(() => {
                EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
                tween(this.rope)
                    .to(0.3, { angle: 0 })
                    .to(0.3, { position: new Vec3(0, this.rope.position.y + 300, 0) })
                    .call(() => {
                        this.claw.children[1].children[0].setParent(SuccessEffect.instance.moveBallNode);
                    })
                    .start();
            }, 0.5);
        } else {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }
    }

    /** 播放背景音乐 */
    private playBGM() {
        // 是否是第一次触摸
        if (this.isFirstTouch) {
            console.log('播放背景音乐');
            AudioManager.play(Constant.AUDIO_TYPE.BGM); // 播放背景音乐
            this.isFirstTouch = false;
        }
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