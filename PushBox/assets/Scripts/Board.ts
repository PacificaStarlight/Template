import { _decorator, Component, instantiate, Node, Prefab, resources, Vec2 } from 'cc';
import { EventManager } from './Framework/Common/Event/EventCenter';
import { BLOCK_TYPE, Constant, RES_PATH } from './Framework/Constant';
import { Block } from './Block';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    @property(Node)
    public blocksNode: Node = null;
    public rows: number = 6;    // 棋盘行数
    public cols: number = 6;    // 棋盘列数
    public board: number[][] = [];
    public boardNode: Node[][] = [];
    public initBlockArray: number[][] = [
        [9, 0, 0, 0, 9, 9],
        [9, 0, 1, 5, 9, 9],
        [9, 9, 5, 1, 0, 0],
        [9, 9, 1, 5, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 9, 9, 9]
    ];
    public targetArray: Vec2[] = [];

    private blockPrefabs: Map<string, Prefab> = new Map();
    public playerPos: Vec2 = new Vec2(2, 1);

    private blockTypeMap = {
        0: BLOCK_TYPE.PLAYER,
        1: BLOCK_TYPE.BLOCK1,
        2: BLOCK_TYPE.BLOCK2,
        3: BLOCK_TYPE.BLOCK3,
        4: BLOCK_TYPE.TARGETBLOCK,
    }; // 块类型映射

    public static instance: Board = null;
    onLoad() {
        Board.instance = this;
        this.preloadBlocks();

    }

    start() {
        this.init();
    }

    /** 初始化棋盘，设置棋盘棋子数据，获取棋盘节点位置信息 */
    private init() {
        let index = 0;
        // 清空现有棋盘
        this.board = [];
        this.boardNode = [];
        // 初始化棋盘数据
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            this.boardNode[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = this.initBlockArray[i][j];
                this.boardNode[i][j] = this.node.children[index];
                index++;
            }
        }
        console.log('初始化结果');
        console.log(this.board);
        // console.log(this.boardNode);

    }

    /** 预先加载预制体，在游戏生命周期开始时将预制体存入到 blockPrefabs 中*/
    private preloadBlocks() {
        const prefabDir = Constant.RES_PATH.PREFABS_BLOCKS; // 预制体路径
        resources.loadDir(prefabDir, Prefab, (err, prefabs: Prefab[]) => {
            if (err) {
                console.error("预加载预制体失败:", err);
                return;
            }
            // 保存预制体引用到类属性中
            this.blockPrefabs = new Map<string, Prefab>();
            prefabs.forEach(prefab => {
                this.blockPrefabs.set(prefab.name, prefab);
                console.log("预加载预制体成功:", prefab.name);
            });

            if (this.blockPrefabs.size == 0) {
                console.log("没有加载到任何预制体，请重新检查路径和文件名");
            }
            this.initBoard(); // 初始化棋盘
        });
    }

    /** 通过名字获取预制体的方法 */
    private getBlockPrefab(prefabName: string): Prefab {
        return this.blockPrefabs.get(prefabName);
    }

    // 初始化棋盘
    private initBoard() {
        if (this.getBlockPrefab == null) return;
        this.blocksNode.removeAllChildren();
        let blockIndex = 1; // 用于获取预制体节点
        // 开始创建棋盘
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] == 5) {
                    this.targetArray.push(new Vec2(i, j)); // 将目标位置存入数组
                    let prefab = this.blockTypeMap[4];
                    const block = this.getBlockPrefab(prefab);
                    this.addPrefab(block, i, j, 0, prefab, 0);
                }
                if (i == this.playerPos.x && j == this.playerPos.y) {
                    let prefab = this.blockTypeMap[0];
                    const block = this.getBlockPrefab(prefab);
                    this.addPrefab(block, i, j, 9, prefab, 1);
                }
                if (this.board[i][j] == 1) {
                    if (blockIndex <= 3) {
                        let prefab = this.blockTypeMap[blockIndex];
                        const block = this.getBlockPrefab(prefab);
                        this.addPrefab(block, i, j, 1, prefab);
                        blockIndex++;
                    }
                }


                if (this.board[i][j] == 5) {
                    this.targetArray.push(new Vec2(i, j)); // 将目标位置存入数组
                    let prefab = this.blockTypeMap[4];
                    const block = this.getBlockPrefab(prefab);
                    this.addPrefab(block, i, j, 0, prefab, 0);
                }

            }
        }
        EventManager.emit(Constant.EVENT_TYPE.INIT_BLOCKS);
        // console.log(this.blocksNode.children);
        console.log('目标位置信息');
        console.log(this.targetArray);
        // console.log(this.board);
    }

    /** 添加预制体
     * @param block 预制体
     * @param row 行
     * @param col 列
     * @param type 加载后显示信息
     * @param name 节点名称
     * @param indexof 节点层级
     */
    private addPrefab(block: Prefab, row: number, col: number, type: number, name: string, indexof?: number) {
        if (block) {
            const blockNode = instantiate(block);
            this.blocksNode.addChild(blockNode);
            blockNode.setSiblingIndex(indexof); // 设置节点层级
            this.addBlockToBoard(blockNode, row, col, type);
        }
        else {
            console.log(name + " 没有找到预制体");
        }
    }

    // 添加方块到棋盘
    public addBlockToBoard(block: Node, row: number, col: number, dir: number) {
        this.board[row][col] = dir;
        block.setWorldPosition(this.boardNode[row][col].worldPosition);
        block.getComponent(Block).transform = new Vec2(row, col);
    }
}