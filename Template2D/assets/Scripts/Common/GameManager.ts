import { _decorator, Component, Node, macro, director, Enum, Prefab, Vec2, instantiate } from 'cc';

import { StateController } from '../Framework/Utils/UIcontrol/StateController';
import { AppLovinEvent } from '../Framework/Utils/SDK/AppLovinEvent';
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

    // @property(Node)
    // public board = null; // 棋盘

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
        AppLovinEvent.SendEvent(AppLovinEvent.CHALLENGE_STARTED);
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
