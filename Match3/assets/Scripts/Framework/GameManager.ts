import { _decorator, Component, Node, macro, director, AudioClip, Enum, Prefab, Vec2 } from 'cc';
import { StateController } from './Utils/UIcontrol/StateController';
import { Constant } from './Constant';
import { ResourceManager } from './Common/Resource/ResourceManager';
import { PoolManager } from './Common/Pools/PoolManager';
import { Board } from '../Board';
import { InputManager } from './InputManager';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // 运行状态
    @property({ type: Enum(Constant.GAME_RUN_STATE) })
    public gameRunState = Constant.GAME_RUN_STATE.RUNNING;

    // UI控制脚本
    @property(Node)
    private uiController: Node = null;

    @property(Node)
    public board = null; // 棋盘1

    public isGameOver: boolean = false; // 游戏是否结束

    private _stateController: StateController = null;
    get stateController() {
        return this._stateController;
    }
    set stateController(value: StateController) {
        this._stateController = value;
    }
    //单例模式
    public static instance: GameManager = null;
    onLoad() {
        GameManager.instance = this;
        director.on('canvas-resize-complete', this.adjustGameContent, this);
        this.stateController = this.uiController.getComponent(StateController);
    }

    start() {
        // this.loadLevelData(3);
    }

    update(deltaTime: number) {
    }

    // 调整游戏内容
    private adjustGameContent(orientation: number) {
        if (orientation === macro.ORIENTATION_PORTRAIT) {
            this.stateController.selectPageByIndex(0);
        } else {
            this.stateController.selectPageByIndex(1);
        }
    }

    public curLevel = 1; // 当前关卡
    public curBoard = new Vec2(); // 当前棋盘的索引

    /** 加载关卡
     * @param level 加载关卡的等级
     */
    public loadLevelData(level: number = 1) {
        let boards = this.board.getComponent(Board);
        this.curLevel = level;
        this.curBoard = new Vec2(boards.row, boards.col); // 获取当前棋盘的索引
        boards.initBoard(level).then(() => {
            console.log(`-----------棋盘${level}: 初始化完成-------------`);
            let board = boards.board;
            let block = boards.block;
            let boardList = boards.getBoardData();
            InputManager.instance.getBoardNode(board, boardList);

            boards.loadChessData(level).then(() => {
                console.log(`-------------棋子${level}: 初始化完成-------------`);
                InputManager.instance.getBlockNode(block);
            });
        }); // 初始化棋盘
    }

    /** 加载超市资源 */
    public loadData_SuperMarket() {

    }

    /** 加载家具店资源 */
    public loadData_FurnitureStore() {

    }
}