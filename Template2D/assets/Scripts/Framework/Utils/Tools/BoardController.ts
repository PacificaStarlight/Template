import { _decorator, Component, instantiate, Layout, Node, Prefab, Sprite, SpriteFrame, tween, UIOpacity, UITransform, view } from 'cc';
import { ResourceManager } from '../../Common/Resource/ResourceManager';
import { AudioManager } from '../../Common/Audio/AudioManager';
import { Constant, RES_PATH } from '../../../Common/Constant';
import { InputManager } from '../../../Common/InputManager';
const { ccclass, property } = _decorator;

@ccclass('BoardController')
export class BoardController extends Component {
    @property
    public row: number = 8;

    @property
    public col: number = 8;

    @property(Node)
    blockNode: Node = null; // 棋盘节点

    @property(Node)
    private boardBg: Node = null; // 棋盘背景节点

    @property(Node)
    private effectNode: Node = null; // 棋盘节点

    @property(SpriteFrame)
    private sf_boards: SpriteFrame[] = []; // 棋子图片数组

    public board: Node[] = [];  // 棋盘上的所有方块
    public block: Node[] = [];  // 棋盘上的所有棋子
    public boardData: Node[][] = [];   // 棋盘数据

    public initBoardData: number[][] = [
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
    ];

    public setBoardData: number[][] = [
        [0, 2, 0, 0, 0, 0, 2, 0],
        [2, 2, 2, 0, 0, 2, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 2, 0, 0, 2, 2],
        [2, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 2, 0, 0, 2, 0, 0],
        [0, 2, 0, 0, 2, 0, 0, 2],
    ]

    /** 第一关卡数据 */
    public levelData_One: number[][] = [
        [0, 0, 0, 3, 0, 0, 0, 7, 0],
        [7, 0, 0, 0, 9, 0, 12, 0],
        [0, 0, 0, 0, 4, 0, 0, 10],
        [9, 0, 5, 0, 3, 0, 0, 0],
        [1, 0, 12, 0, 1, 0, 0, 0],
        [0, 9, 0, 0, 3, 0, 0, 3],
        [0, 14, 5, 0, 0, 0, 1, 7],
        [10, 0, 0, 0, 7, 13, 0,],
    ];

    start() {
        view.on('canvas-resize', this.onResize, this);
    }
    onDestroy() {
        view.off('canvas-resize', this.onResize, this);
    }

    private onResize() {
        this.updateBlockPos(); // 更新棋子位置
    }

    //#region 棋盘初始化
    /** 初始化棋盘 */
    public async initBoard(level: number = 1) {
        const loadPromises: Promise<void>[] = [];
        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.col; j++) {
                const promise = new Promise<void>((resolve, reject) => {
                    ResourceManager.loadResource(RES_PATH.GRID + '0', Prefab, (err, prefab) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }
                        let board = instantiate(prefab);
                        board.setParent(this.node);
                        board.setPosition(0, 0, 0);
                        board.setScale(0, 0, 1);
                        this.board.push(board);
                        resolve();
                    });
                });
                loadPromises.push(promise);
            }
        }
        // 等待所有资源加载完成
        await Promise.all(loadPromises);

        // console.log(this.board); // 此时数组已填充完成
        let layout = this.node.getComponent(Layout);
        if (layout) {
            console.log("Layout");
            this.setBoardPosition(layout); // 设置棋盘位置    
        }
        else {
            // console.log("No Layout");
            this.node.addComponent(Layout); // 添加 Layout 组件
            if (layout) {
                this.setBoardPosition(layout); // 设置棋盘位置
            }
        }

        for (let i = 0; i < this.board.length; i++) {
            let index = this.initBoardData[Math.floor(i / this.col)][i % this.col];
            this.board[i].getComponent(Sprite).spriteFrame = this.sf_boards[index];
        }

        console.log("所有棋盘动画已完成");
    }

    /** 设置棋盘的位置 */
    private setBoardPosition(layout: Layout) {
        layout.type = Layout.Type.GRID; // 设置布局类型为网格布局
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.startAxis = Layout.AxisDirection.HORIZONTAL;
        layout.paddingLeft = 0;
        layout.paddingRight = 0;
        layout.paddingTop = 0;
        layout.paddingBottom = 0;
        layout.spacingX = 0;
        layout.spacingY = 0;
        layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
        layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        layout.constraint = Layout.Constraint.FIXED_COL;
        layout.constraintNum = this.col; // 设置列数
        this.node.getComponent(UITransform).width = this.board[0].getComponent(UITransform).width * this.col + layout.spacingX * this.col;
        // console.log(this.node.getComponent(UITransform).width);
    }


    /** 获取棋盘数据 */
    public getBoardData() {
        console.log('获取棋盘数据：')
        for (let i = 0; i < this.row; i++) {
            this.boardData[i] = [];
            for (let j = 0; j < this.col; j++) {
                this.boardData[i][j] = this.board[i * this.col + j];
            }
        }
        console.log(this.boardData);
        return this.boardData;
    }
    //#endregion

    //#region 棋子数据
    /** 加载棋子数据 */
    public async loadChessData(level: number = 1) {
        let data = [];
        switch (level) {
            case 1:
                data = this.levelData_One;
                break;
            default:
                console.log('暂无此关卡数据');
                break;
        }
        const loadPromises: Promise<void>[] = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].length; j++) {
                if (data[i][j] <= 0 || data[i][j] >= 999) continue;
                const promise = new Promise<void>((resolve, reject) => {
                    ResourceManager.loadResource(RES_PATH.BLOCK, Prefab, (err, prefab) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }
                        // console.log('需要加载棋子类型：' + chess + ' 棋子坐标：' + rowIndex + ',' + chess);
                        let block = instantiate(prefab);
                        block.setParent(this.blockNode);
                        // block.getComponent(Block).transform = new Vec3(i, j, 0);
                        // block.getComponent(Block).setChess(data[i][j]);
                        this.block.push(block); // 将棋子添加到棋子数组中
                        block.setWorldPosition(this.boardData[i][j].worldPosition); // 设置棋子的世界坐标
                        if (i == 2 && j == 4) {
                            block.active = false;
                        }
                        else if (i == 4 && j == 2) {
                            block.active = false;
                        }
                        else if (i == 6 && j == 7) {
                            block.active = false;
                        }

                        resolve();
                    });
                });
                loadPromises.push(promise);
            }
        }
        // 等待所有资源加载完成
        await Promise.all(loadPromises);
    }

    /** 显示棋子数据 */
    public showBlock() {
        console.log('显示棋子数据：', this.block);
        if (!InputManager.instance.isFirstTouch) {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.BOARD, 1.5);
        }
        this.block.forEach((block) => {
            if (block.active == true) return;
            block.active = true;
        })
    }

    /** 更新棋子的位置 */
    private updateBlockPos() {
        // for (let i = 0; i < this.block.length; i++) {
        //     let block = this.block[i];
        //     let x = block.getComponent(Block).transform.x;
        //     let y = block.getComponent(Block).transform.y;
        //     block.setWorldPosition(this.board[x * this.col + y].worldPosition.clone());
        //     // console.log(block.worldPosition); // 输出棋子的世界坐标
        // }
    }
    //#endregion
}
