import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform, Button } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { GuideManager } from './Utils/Guide/GuideManager';
import { AudioManager } from './Common/Audio/AudioManager';
const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();
@ccclass('InputManager')
export class InputManager extends Component {
    @property([Node])
    private boardList: Node[] = []; // 棋盘
    @property([Node])
    private blockList: Node[] = [];    // 块
    @property(Node)
    private moveNode: Node = null; // 移动节点

    /** block，card，node，child之类的 
     * 存储块的索引(block，card，node，child之类的)，通过 blockList 获取
     */
    public block: Node[] = [];     // 块
    /**board，List，Node[]之类的
     * 存储块的索引(board，List，Node[]之类的)，通过 boardList 获取
     */
    private board: Node[] = [];     // 棋盘

    private curChooseNode: Node = null; // 当前选中的节点
    private lateChooseNode: Node = null; // 第二选中的节点
    private curChooseBoard: Node = null; // 当前选中的节点索引

    private chooseIndex = 0;

    private waitTime: number = 5; // 等待时间
    private hideTime: number = 0; // 隐藏时间

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
    // 单例模式
    public static instance: InputManager;

    onLoad() {
        InputManager.instance = this; // 单例模式
        // 监听触摸事件
        this.startListening();
        EventManager.on(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    start() {
        this.boardList.forEach(child => {
            child.children.forEach(child => {
                this.board.push(child);
            });
        });
        this.initBlocks(); // 初始化块
        console.log(this.board);
    }

    // 初始化块
    public initBlocks() {
        this.block = [];
        this.blockList.forEach(child => {
            child.children.forEach(block => {
                this.block.push(block); // 获取子节点的子节点
            });
        });
        console.log(this.block);
    }

    update(deltaTime: number) {
        if (this.cd_ShowGuide) {
            this.hideTime += deltaTime;
            if (this.hideTime > this.waitTime && !this.isOver) {
                this.showGuide();
            }
        }
    }

    onDisable() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    // 触摸开始事件
    onTouchStart(event: EventTouch) {
        // console.log('开始触摸');
        // this.touchStartPos = event.getLocation();
        this.releaseTempVar(); // 释放临时变量

        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        this.hideGuide(); // 隐藏引导

        this.onStartDrag(); // 开始拖动
    }

    // 触摸移动事件
    onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        // console.log('触摸移动');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.hideGuide(); // 隐藏引导
        this.onStartDrag(); // 开始拖动
    }

    // 触摸结束事件
    onTouchEnd(event: EventTouch) {
        if (GameManager.instance.isGameOver) {
            SDKManager.instance.clickDown();
            return;
        }

        // console.log('触摸结束 ');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        /** 计算屏幕移动方向或者距离 
        const startPos = this.touchStartPos;
        const endPos = event.getLocation();
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
        this.playBGM();

        // 显示引导
        if (!this.cd_ShowGuide) {
            EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE);     // 显示引导
            this.cd_ShowGuide = true;
        }

        this.releaseTempVar(); // 释放临时变量
    }

    // 释放临时变量
    private releaseTempVar() {
        this.hideTime = 0;
        this.curChooseNode = null;
        this.lateChooseNode = null;
        this.curChooseBoard = null;
        this.touchStartPos = null;
    }

    // 开始拖动
    private onStartDrag() {
        if (this.isMoving) return;
        let targetBlock = this.block; // 获取块
        if (this.curChooseNode == null) {
            for (let i = 0; i < targetBlock.length; i++) {
                const block = targetBlock[i];
                const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 判断是否包含块
                if (isContain) {
                    this.curChooseNode = block;
                    // console.log('已选中的块 ' + this.curChooseNode.name);
                    AudioManager.playOneShot(Constant.AUDIO_TYPE.TIP_SFX_DU);// 播放音效
                    break;
                }
            }
        }
        else {
            console.log('移动已选中的块 ' + this.curChooseNode.name);
            this.curChooseNode.setWorldPosition(tempV3);
        }
    }

    // 结束拖动
    private onFinishDrag() {
        const targetBlock = this.block; // 获取块
        const targetBoard = this.board; // 获取板子

        // 块节点
        if (this.lateChooseNode == null) {
            for (let i = 0; i < targetBlock.length; i++) {
                if (i == this.chooseIndex) continue;
                const block = targetBlock[i];
                const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 获取块的位置
                if (isContain) {
                    this.lateChooseNode = block;
                    console.log('被选中的块： ' + this.lateChooseNode.name);
                    if (false) {
                    }
                    else {
                        console.log('拒绝移动');
                        AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
                    }
                }
            }
        }

        // 拖动结束后的逻辑，把拖动的方块移动到正确的位置        
        if (this.curChooseNode != null) {
            this.moveBlock(this.startParent, this.startPos);
        }
    }

    // 尝试移动
    private TryToMove(node: Node, dir: number) {

        // block.blockType = dir; // 设置块的方向
        this.isMoving = true;
        switch (dir) {
            case Constant.MOVE_TYPE.UP:
                GuideManager.instance.updateGuidePos(); // 更新引导位置
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
                this.moveFailed();
                break;
            case Constant.MOVE_TYPE.DOWN:
                GuideManager.instance.updateGuidePos(); // 更新引导位置
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
                this.moveFailed();
                break;

            case Constant.MOVE_TYPE.LEFT:
                GuideManager.instance.updateGuidePos(); // 更新引导位置
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
                this.moveFailed();
                break;

            case Constant.MOVE_TYPE.RIGHT:
                GuideManager.instance.updateGuidePos(); // 更新引导位置
                AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
                this.moveFailed();
                break;
        }
    }

    // 移动块
    private moveBlock(newParent: Node, newPos: Vec3) {

    }

    // 检查是否胜利
    private checkWin() {
        if (this.isOver) {
            return;
        }
        console.log('游戏胜利！');
        this.gameOver(true); // 游戏胜利
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
        this.block = [];
        this.board = [];
        this.releaseTempVar(); // 释放临时变量
        this.cancelListening(); // 取消监听
        this.scheduleOnce(() => {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }, 0.5);
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