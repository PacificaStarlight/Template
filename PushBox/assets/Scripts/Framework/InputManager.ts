import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform, Button, randomRangeInt } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { GuideManager } from './Utils/Guide/GuideManager';
import { AudioManager } from './Common/Audio/AudioManager';
import { Board } from '../Board';
import { Block } from '../Block';
const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();
@ccclass('InputManager')
export class InputManager extends Component {
    @property([Node])
    private boardList: Node[] = []; // 棋盘
    @property([Node])
    private blockList: Node[] = [];    // 块

    @property([Node])
    private btnArrowList: Node[] = []; // 引导
    @property(Node)
    private btnUndo: Node = null; // 撤销按钮
    private player: Node = null; // 玩家

    public moveInfo: Vec2[][] = []; // 移动信息

    /** block，card，node，child之类的 
     * 存储块的索引(block，card，node，child之类的)，通过 blockList 获取
     */
    public block: Node[] = [];     // 块
    /**board，List，Node[]之类的
     * 存储块的索引(board，List，Node[]之类的)，通过 boardList 获取
     */
    private board: Node[][] = [];     // 棋盘

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
        this.btnArrowList.forEach(child => {
            child.children.forEach((btn, index) => {
                let button = btn.getComponent(Button);
                button.transition = Button.Transition.SCALE;
                button.zoomScale = 1.1;
                btn.on(Button.EventType.CLICK, () => { this.onClick_BtnArrow(index) }, this);
            });
        });
        this.btnUndo.on(Button.EventType.CLICK, this.onClick_BtnUndo, this);
        // this.initBlocks(); // 初始化块
    }

    // 初始化块
    public initBlocks() {
        this.board = [];
        this.block = [];

        this.board = Board.instance.boardNode; // 获取棋盘

        this.blockList.forEach(child => {
            child.children.forEach(block => {
                if (block.getComponent(Block).isPlayer) {
                    this.player = block;
                }
                this.block.push(block); // 获取子节点的子节点
            });
        });
        // console.log(this.block);
        // console.log(this.player);
        // console.log("玩家位置：" + this.player.getComponent(Block).transform);
    }

    update(deltaTime: number) {
        if (this.cd_ShowGuide) {
            this.hideTime += deltaTime;
            console.log("显示引导倒计时");
            if (this.hideTime > this.waitTime) {
                EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, true);
                // console.log('打开引导UI');
                this.cd_ShowGuide = false;        // 设置为false，表示打开引导UI
                this.hideTime = 0;
            }
        }
    }

    onDisable() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.INIT_BLOCKS, this.initBlocks, this);
    }

    /** 方向箭头按钮事件 */
    private onClick_BtnArrow(index: number) {
        this.playBGM();
        this.hideGuide();
        switch (index) {
            case 0:
                console.log('点击了 上 箭头');
                this.TryToMove(this.player, Constant.MOVE_TYPE.UP);

                break;
            case 1:
                console.log('点击了 下 箭头');
                this.TryToMove(this.player, Constant.MOVE_TYPE.DOWN);

                break;
            case 2:
                console.log('点击了 左 箭头');
                this.TryToMove(this.player, Constant.MOVE_TYPE.LEFT);

                break;
            case 3:
                console.log('点击了 右 箭头');
                this.TryToMove(this.player, Constant.MOVE_TYPE.RIGHT);

                break;
        }
        AudioManager.playOneShot(Constant.AUDIO_TYPE.TIP_SFX_DU);
    }

    /** 撤销按钮事件 */
    private onClick_BtnUndo() {
        let button = this.btnUndo.getComponent(Button);
        button.transition = Button.Transition.SCALE;
        button.zoomScale = 1.1;
        // console.log('点击了 撤销');
        this.undoMove(); // 撤销移动
        AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL);
    }

    // 触摸开始事件
    private onTouchStart(event: EventTouch) {
        // console.log('开始触摸');
        // this.touchStartPos = event.getLocation();

        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);

        this.hideGuide(); // 隐藏引导

        this.onStartDrag(); // 开始拖动
    }

    // 触摸移动事件
    private onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        // console.log('触摸移动');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
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

        // this.onFinishDrag(); // 结束拖动

        this.playBGM();     // 播放背景音乐

        this.showGuide();   // 显示引导

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
        let targetBoard = this.board; // 获取板子
        if (this.curChooseBoard == null) {
            for (let i = 0; i < targetBoard.length; i++) {
                for (let j = 0; j < targetBoard[0].length; j++) {
                    const board = targetBoard[i][j];
                    const isContain = board.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 判断是否包含块
                    if (isContain) {
                        this.curChooseBoard = board;
                        // console.log('已选中的板 ' + this.curChooseBoard.name);
                        // console.log('已选中的坐标 ' + i + ' ' + j);
                        // console.log(`坐标的信息为：${Board.instance.board[i][j]}`);
                        // break;
                    }
                }
            }
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
        // let random = randomRangeInt(0, 10) + 1; // 随机数1-10
        // console.log(`---------------------------------------------${random}`);
        this.isMoving = true;
        let board = Board.instance.board;
        let block = null;
        let trans = node.getComponent(Block).transform; // 获取块的位置

        switch (dir) {
            case Constant.MOVE_TYPE.UP:
                console.log('向上移动');
                if (board[trans.x][trans.y] == 1) {
                    board[trans.x][trans.y] = 0;
                }
                trans.x -= 1;
                if (trans.x < 0 || board[trans.x][trans.y] == 9) {
                    console.log('越界，拒绝移动');
                    trans.x += 1;
                }
                else if (board[trans.x][trans.y] == 1) {
                    console.log(this.block);
                    if (board[trans.x - 1][trans.y] == 0) {
                        for (let i = 0; i < this.block.length; i++) {
                            // console.log(this.block[i].name, this.block[i].getComponent(Block).transform);
                            let blockPos = this.block[i].getComponent(Block).transform;
                            if (blockPos.x == trans.x && blockPos.y == trans.y) {
                                block = this.block[i];
                                console.log(block);
                            }
                        }
                        console.log('最上边的方块为' + block.name);
                        Board.instance.addBlockToBoard(block, trans.x - 1, trans.y, 1);
                        console.log('可以推动');
                        this.recordMove();
                        Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                    }
                    else {
                        console.log('不可以推动');
                        trans.x += 1;
                    }
                }
                else if (board[trans.x][trans.y] == 0) {
                    // 记录移动信息
                    this.recordMove();
                    console.log(board[trans.x][trans.y]);
                    Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                }

                console.log('移动结果 ---------------------------------------------------------');
                console.log(board);

                break;
            case Constant.MOVE_TYPE.DOWN:
                console.log('向下移动');
                if (board[trans.x][trans.y] == 1) {
                    board[trans.x][trans.y] = 0;
                }
                trans.x += 1;
                if (trans.x < 0 || board[trans.x][trans.y] == 9) {
                    console.log('越界，拒绝移动');
                    trans.x -= 1;
                }
                else if (board[trans.x][trans.y] == 1) {
                    console.log(this.block);
                    if (board[trans.x + 1][trans.y] == 0) {
                        for (let i = 0; i < this.block.length; i++) {
                            // console.log(this.block[i].name, this.block[i].getComponent(Block).transform);
                            let blockPos = this.block[i].getComponent(Block).transform;
                            if (blockPos.x == trans.x && blockPos.y == trans.y) {
                                block = this.block[i];
                                console.log(block);
                            }
                        }
                        console.log('最下边的方块为' + block.name);
                        Board.instance.addBlockToBoard(block, trans.x + 1, trans.y, 1);
                        console.log('可以推动');
                        this.recordMove();
                        Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                    }
                    else {
                        console.log('不可以推动');
                        trans.x -= 1;
                    }
                }
                else if (board[trans.x][trans.y] == 0) {
                    // 记录移动信息
                    this.recordMove();
                    console.log(board[trans.x][trans.y]);
                    Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                }

                console.log('移动结果 ---------------------------------------------------------');
                console.log(board);


                break;

            case Constant.MOVE_TYPE.LEFT:
                console.log('向左移动');
                if (board[trans.x][trans.y] == 1) {
                    board[trans.x][trans.y] = 0;
                }
                trans.y -= 1;
                if (trans.y < 0 || board[trans.x][trans.y] == 9) {
                    console.log('越界，拒绝移动');
                    trans.y += 1;
                }
                else if (board[trans.x][trans.y] == 1) {
                    console.log(this.block);
                    if (board[trans.x][trans.y - 1] == 0) {
                        for (let i = 0; i < this.block.length; i++) {
                            // console.log(this.block[i].name, this.block[i].getComponent(Block).transform);
                            let blockPos = this.block[i].getComponent(Block).transform;
                            if (blockPos.x == trans.x && blockPos.y == trans.y) {
                                block = this.block[i];
                                console.log(block);
                            }
                        }
                        console.log('最左边的方块为' + block.name);
                        Board.instance.addBlockToBoard(block, trans.x, trans.y - 1, 1);
                        console.log('可以推动');
                        this.recordMove();
                        Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                    }
                    else {
                        console.log('不可以推动');
                        trans.y += 1;
                    }
                }
                else if (board[trans.x][trans.y] == 0) {
                    // 记录移动信息
                    this.recordMove();
                    console.log(board[trans.x][trans.y]);
                    Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                }

                console.log('移动结果 ---------------------------------------------------------');
                console.log(board);
                break;

            case Constant.MOVE_TYPE.RIGHT:
                console.log('向右移动');
                if (board[trans.x][trans.y] == 1) {
                    board[trans.x][trans.y] = 0;
                }
                trans.y += 1;
                if (trans.y >= 6 || board[trans.x][trans.y] == 9) {
                    console.log('越界，拒绝移动');
                    trans.y -= 1;
                }
                else if (board[trans.x][trans.y] == 1) {
                    for (let i = 0; i < this.block.length; i++) {
                        let blockPos = this.block[i].getComponent(Block).transform;
                        if (blockPos.x == trans.x && blockPos.y == trans.y) {
                            block = this.block[i];
                        }
                    }
                    console.log('最右边的方块为' + block.name);

                    if (board[trans.x][trans.y + 1] == 0) {
                        Board.instance.addBlockToBoard(block, trans.x, trans.y + 1, 1);
                        console.log('可以推动');
                        this.recordMove();
                        Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                    }
                    else {
                        console.log('不可以推动');
                        trans.y -= 1;
                    }
                }
                else if (board[trans.x][trans.y] == 0) {
                    this.recordMove();
                    // console.log(board[trans.x][trans.y]);
                    Board.instance.addBlockToBoard(node, trans.x, trans.y, 1);
                }
                console.log('移动结果 ---------------------------------------------------------');
                console.log(board);
                break;
        }

        this.checkWin();
    }

    /** 撤回移动 */
    private undoMove() {
        let undoVec2: Vec2[] = this.moveInfo[this.moveInfo.length - 2];
        console.log('撤回坐标 ---------------------------------------------------------');
        console.log(undoVec2);
        if (undoVec2 == null) return;
        for (let i = 3; i < this.block.length; i++) {
            let blockTrans = this.block[i].getComponent(Block).transform;
            Board.instance.board[blockTrans.x][blockTrans.y] = 0;
        }
        for (let i = 0; i < undoVec2.length; i++) {
            let blockIndex = i + 3;
            Board.instance.addBlockToBoard(this.block[blockIndex], undoVec2[i].x, undoVec2[i].y, 1);
        }
        this.moveInfo.pop();
        // console.log(this.moveInfo);
        // console.log(Board.instance.board);
    }

    /** 记录移动信息 */
    private recordMove() {
        let transVec2: Vec2[] = [];
        for (let i = 3; i < this.block.length; i++) {
            let trans = this.block[i].getComponent(Block).transform;
            transVec2.push(new Vec2(trans.x, trans.y));
        }
        this.moveInfo.push(transVec2);
        console.log('记录移动信息 ---------------------------------------------------------');
        console.log(this.moveInfo);
    }

    // 移动块
    private moveBlock(newParent: Node, newPos: Vec3) {

    }

    // 检查是否胜利
    private checkWin() {
        if (this.isOver) {
            return;
        }
        let blockCount = 0;
        for (let i = 4; i < this.block.length; i++) {
            let block = this.block[i].getComponent(Block).transform;
            // console.log('当前块为' + this.block[i].name);
            // console.log(block);

            for (let j = 0; j < Board.instance.targetArray.length; j++) {
                let board = Board.instance.targetArray[j];
                // console.log(board);
                if (block.x == board.x && block.y == board.y) {
                    blockCount++;
                    console.log('找到目标块' + blockCount);
                    break;
                }
            }
        }

        if (blockCount == Board.instance.targetArray.length) {
            console.log('游戏胜利！');
            this.gameOver(true); // 游戏胜利
        }
    }

    // 移动失败
    private moveFailed() {
        // this.curChooseNode.getComponent(Animation).play(); // 播放移动失败动画
        AudioManager.playOneShot(Constant.AUDIO_TYPE.NEG_SFX_FAIL); // 播放移动失败音效
    }

    private gameOver(isWin: boolean = false) {
        this.block = [];
        this.board = [];
        this.btnArrowList.forEach(child => {
            child.children.forEach((btn, index) => {
                btn.active = false;
                btn.off(Button.EventType.CLICK, () => { this.onClick_BtnArrow(index) }, this);
            });
        });
        this.btnUndo.active = false;
        this.releaseTempVar(); // 释放临时变量
        // this.cancelListening(); // 取消监听
        this.scheduleOnce(() => {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }, 1);
    }



    /** 播放BGM */
    private playBGM() {
        // 是否是第一次触摸
        if (this.isFirstTouch) {
            AudioManager.play(Constant.AUDIO_TYPE.BGM); // 播放背景音乐
            this.isFirstTouch = false;
        }
    }

    /** 显示引导 */
    private showGuide() {
        if (!this.cd_ShowGuide) {
            EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE);     // 显示引导
            this.cd_ShowGuide = true;
        }
    }

    // 隐藏引导
    private hideGuide() {
        console.log("隐藏引导");
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, false);     // 显示引导
        this.cd_ShowGuide = false;
        this.hideTime = 0;
    }

    // 开始监听
    public startListening() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    // 取消监听
    public cancelListening() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}