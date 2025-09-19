import { _decorator, Component, Node, macro, director, AudioClip, Enum } from 'cc';
import { StateController } from './Utils/UIcontrol/StateController';
import { Constant } from './Constant';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // 运行状态
    @property({ type: Enum(Constant.GAME_RUN_STATE) })
    public gameRunState = Constant.GAME_RUN_STATE.RUNNING;

    // UI控制脚本
    @property(Node)
    private uiController: Node = null;

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
}