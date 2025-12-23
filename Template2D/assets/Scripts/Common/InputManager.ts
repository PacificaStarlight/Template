import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform } from 'cc';
import { GameManager } from './GameManager';
import { EventManager } from '../Framework/Common/Event/EventCenter';
import { AudioManager } from '../Framework/Common/Audio/AudioManager';
import { Constant } from './Constant';

const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();

@ccclass('InputManager')
export class InputManager extends Component {

    /** block，card，chess，node，child之类的 
     * 存储块的索引(block，card，node，child之类的)
     */
    public block: Node[] = [];     // 块
    public blockData: number[][] = []; // 块数据
    /**board，List，Node[]之类的
     * 存储块的索引(board，List，Node[]之类的)
     */
    private board: Node[] = [];     // 棋盘
    public boardData: Node[][] = [];     // 棋盘

    private firChoose_Block: Node = null; // 当前选中的棋子节点
    private secChoose_Block: Node = null; // 第二选中的棋子节点
    // private firChoose_Board: Node = null; // 当前选中的棋盘节点
    // private secChoose_Board: Node = null; // 第二选中的棋盘节点
    private chooseIndex = 0;
    isFirstTouch: boolean = true; // 是否是第一次触摸
    private isMoving: boolean = false; // 是否正在移动

    // 单例模式
    public static instance: InputManager;

    onLoad() {
        InputManager.instance = this; // 单例模式
        // 监听触摸事件
        this.startListening();
    }
    start() {
        EventManager.on(Constant.EVENT_TYPE.PLAY_BGM, this.playBGM, this);
    }
    onDestroy() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.PLAY_BGM, this.playBGM, this);
    }

    update(deltaTime: number) {
    }
    //#region 初始化数据
    /** 获取棋盘信息 */
    public getBoardNode(board: Node[], boardList: Node[][]) {
        this.board = board;
        this.boardData = boardList;
        console.log('输入管理器获取棋盘信息：')
        console.log(this.board);
    }

    /** 获取棋子信息 */
    public getBlockNode(block: Node[]) {
        this.block = block;
        console.log('输入管理器获取块信息：')
        console.log(this.block);
        this.blockData = [];
        // for (let i = 0; i < GameManager.instance.curBoard.x; i++) {
        //     this.blockData[i] = [];
        //     for (let j = 0; j < GameManager.instance.curBoard.y; j++) {
        //         this.blockData[i][j] = 0;
        //     }
        // }
        this.updateBlockData();
    }

    private updateBlockData() {
        for (let i = 0; i < this.block.length; i++) {
            let block = this.block[i];
            // let transform = block.getComponent(Block).transform;
            // let type = block.getComponent(Block).type;
            // this.blockData[transform.x][transform.y] = type;
        }
        console.log(this.blockData); // 打印块数据
    }

    //#endregion

    //#region 触摸事件 Touch
    // 触摸开始事件
    onTouchStart(event: EventTouch) {
        // console.log('开始触摸');
        this.releaseTempVar(); // 释放临时变量
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        // 是否是第一次触摸
        this.playBGM();
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
        // console.log('触摸结束 ');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.onFinishDrag(); // 结束拖动
        // // 是否是第一次触摸
        // this.playBGM();

        this.releaseTempVar(); // 释放临时变量
    }

    // 释放临时变量
    private releaseTempVar() {
        this.firChoose_Block = null;
        this.secChoose_Block = null;
        // this.firChoose_Board = null;
        // this.secChoose_Board = null;
        // this.touchStartPos = null;
    }

    // 开始拖动
    private onStartDrag() {
        let targetBlock = this.block; // 获取块
        if (this.firChoose_Block == null) {
            for (let i = 0; i < targetBlock.length; i++) {
                const block = targetBlock[i];
                this.chooseIndex = i;
                const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 判断是否包含块
                if (isContain) {
                    if (this.isMoving) return;
                    this.firChoose_Block = block;
                    this.firChoose_Block.setSiblingIndex(this.block.length - 1); // 设置块的层级
                    console.log('第一选中的块 ' + this.firChoose_Block.name); // 获取块的名字

                    // this.isMoving = true;
                    // AudioManager.playOneShot(Constant.AUDIO_TYPE.CLICK); // 播放点击音效
                    break;
                }
            }
        }
        else {
            // if (this.firChoose_Block == null) return;
            // this.firChoose_Block.setWorldPosition(tempV3);
            // for (let i = 0; i < targetBlock.length; i++) {
            //     if (i == this.chooseIndex) continue;
            //     const block = targetBlock[i];
            //     if (block == this.secChoose_Block) continue;
            //     const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 获取块的位置
            //     if (isContain) {
            //         this.secChoose_Block = block;
            //         console.log('第二选中的块: ' + this.secChoose_Block.name + ' '
            //             + this.secChoose_Block.getComponent(Block).type
            //         );
            //     }
            // }
        }
    }

    // 结束拖动
    private onFinishDrag() {
        const targetBlock = this.block; // 获取块
        if (this.firChoose_Block != null) {
            this.firChoose_Block.scale = new Vec3(1, 1, 1); // 设置块的大小
        }
        this.isMoving = false;

        // if (this.firChoose_Block == null) return;
        // else {
        //     this.firChoose_Block.setWorldPosition(this.originalPos); // 设置块的位置
        // }
    }
    //#endregion


    //#region 其他
    /** 游戏结束 */
    private gameOver(isWin: boolean = false) {
        console.log('=========================================================游戏结束');
        this.block = [];
        this.board = [];
        this.releaseTempVar(); // 释放临时变量
        this.scheduleOnce(() => {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }, 0);
    }

    /** 播放背景音乐 */
    private playBGM() {
        // 是否是第一次触摸
        if (this.isFirstTouch) {
            console.log('播放背景音乐');
            AudioManager.play(Constant.AUDIO_TYPE.BGM, 0.8); // 播放背景音乐
            this.isFirstTouch = false;
        }
    }

    /** 隐藏引导 */
    private hideGuide(isHide: boolean = false) {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, isHide);     // 显示引导
    }

    /** 开始监听全局触摸事件 */
    public startListening() {
        console.log('开始监听全局触摸事件');
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /** 取消监听全局触摸事件 */
    public cancelListening() {
        console.log('取消监听全局触摸事件');
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    //#endregion
}