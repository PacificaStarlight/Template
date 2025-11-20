import { _decorator, Component, instantiate, Layout, Node, Prefab, UITransform, Vec3, view } from 'cc';
import { ResourceManager } from './Framework/Common/Resource/ResourceManager';
import { RES_PATH } from './Framework/Constant';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    @property(Number)
    public row: number = 6;

    @property(Number)
    public col: number = 5;

    @property(Node)
    private blockNode: Node = null; // 棋盘节点

    public board: Node[] = [];  // 棋盘上的所有方块
    public block: Node[] = [];  // 棋盘上的所有棋子
    public boardData: Node[][] = [];   // 棋盘数据
    /** 第一关卡数据 */
    public levelData_One: number[][] = [
        [3, 1, 1, 3, 1],
        [4, 4, 1, 1, 4],
        [4, 3, 2, 1, 2],
        [3, 4, 2, 2, 3],
        [4, 2, 4, 2, 1],
        [3, 4, 1, 2, 3],
    ];
    /** 第二关卡数据 - 8对相邻数字 */
    public levelData_Two: number[][] = [
        [2, 2, 4, 3, 3],  // 2对: (0,0)-(0,1)的2, (0,3)-(0,4)的3
        [1, 4, 4, 1, 1],  // 3对: (1,1)-(1,2)的4, (1,3)-(1,4)的1
        [3, 2, 1, 4, 2],  // 0对
        [4, 4, 3, 3, 1],  // 2对: (3,0)-(3,1)的4, (3,2)-(3,3)的3
        [2, 1, 1, 4, 3],  // 1对: (4,1)-(4,2)的1
        [3, 2, 4, 4, 2]   // 1对: (5,2)-(5,3)的4
    ];  // 总计: 8对相邻相同数字

    /** 第三关卡数据 - 8对相邻数字 */
    public levelData_Three: number[][] = [
        [1, 3, 3, 2, 4],  // 1对: (0,1)-(0,2)的3
        [4, 1, 2, 2, 1],  // 2对: (1,2)-(1,3)的2, (1,1)-(1,4)的1
        [3, 4, 4, 3, 2],  // 1对: (2,1)-(2,2)的4
        [2, 1, 3, 3, 4],  // 1对: (3,2)-(3,3)的3
        [4, 4, 1, 2, 2],  // 3对: (4,0)-(4,1)的4, (4,3)-(4,4)的2
        [1, 3, 2, 4, 1]   // 0对
    ];  // 总计: 8对相邻相同数字

    start() {
        view.on('canvas-resize', this.onResize, this);
    }
    onDestroy() {
        view.off('canvas-resize', this.onResize, this);
    }

    private onResize() {
        this.updateBlockPos(); // 更新棋子位置
    }

    /** 初始化棋盘 */
    // 修改后的 initBoard 方法
    public async initBoard(level: number = 1) {
        let index = 0;
        const loadPromises: Promise<void>[] = [];

        for (let i = 0; i < this.row; i++) {
            for (let j = 0; j < this.col; j++) {
                const promise = new Promise<void>((resolve, reject) => {
                    ResourceManager.loadResource(RES_PATH.GRID + level, Prefab, (err, prefab) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }
                        let board = instantiate(prefab);
                        board.setParent(this.node);
                        board.setPosition(0, 0, 0);
                        board.name = `Grid${index++}`;
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
            // console.log("Layout");
            this.setBoardPosition(layout); // 设置棋盘位置    
        }
        else {
            // console.log("No Layout");
            this.node.addComponent(Layout); // 添加 Layout 组件
            if (layout) {
                this.setBoardPosition(layout); // 设置棋盘位置
            }
        }
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
        layout.spacingX = -1;
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

    /** 加载棋子数据 */
    public async loadChessData(level: number = 1) {

        let data = [];
        switch (level) {
            case 1:
                data = this.levelData_One;
                break;
            case 2:
                data = this.levelData_Two;
                break;
            case 3:
                data = this.levelData_Three;
                break;
            default:
                console.log('暂无此关卡数据');
                break;
        }
        const loadPromises: Promise<void>[] = [];
        let number = 0;
        data.forEach((row, rowIndex) => {
            row.forEach((chessType, chessIndex) => {
                const promise = new Promise<void>((resolve, reject) => {
                    ResourceManager.loadResource(RES_PATH.BLOCK + chessType, Prefab, (err, prefab) => {
                        if (err) {
                            console.error(err);
                            reject(err);
                            return;
                        }
                        // console.log('需要加载棋子类型：' + chessType + ' 棋子坐标：' + rowIndex + ',' + chessIndex);
                        let block = instantiate(prefab);
                        block.setParent(this.blockNode);
                        block.name = `Block${number++}`;
                        block.getComponent(Block).transform = new Vec3(rowIndex, chessIndex, 0);
                        this.block.push(block); // 将棋子添加到棋子数组中
                        let trans = block.getComponent(Block).transform;
                        let index = trans.x * this.col + trans.y;
                        block.setWorldPosition(this.board[index].worldPosition); // 设置棋子的世界坐标
                        resolve();
                    });
                });
                loadPromises.push(promise);
            });
        });
        // 等待所有资源加载完成
        await Promise.all(loadPromises);
        // console.log(this.block); // 此时数组已填充完成
    }

    /** 更新棋子的位置 */
    private updateBlockPos() {
        for (let i = 0; i < this.block.length; i++) {
            let block = this.block[i];
            let x = block.getComponent(Block).transform.x;
            let y = block.getComponent(Block).transform.y;
            block.setWorldPosition(this.board[x * this.col + y].worldPosition.clone());
            // console.log(block.worldPosition); // 输出棋子的世界坐标
        }
    }
}