import { _decorator, Component, Node, macro, director, AudioClip, Enum, view } from 'cc';
import { StateController } from './Utils/UIcontrol/StateController';
import { Constant } from './Constant';
import { CameraController } from './Utils/ComponentController/CameraController';
import { InputManager } from './InputManager';
import { EventManager } from './Common/Event/EventCenter';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    // 运行状态
    @property({ type: Enum(Constant.GAME_RUN_STATE) })
    public gameRunState = Constant.GAME_RUN_STATE.RUNNING;
    // UI控制脚本
    @property(Node)
    private uiController: Node = null;
    /** 游戏是否结束 */
    public isGameOver: boolean = false;
    /** 游戏是否是横屏 */
    public isLandscape: boolean = false;

    /** 状态控制器 */
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

        view.on('canvas-resize', this.canvasResize, this);
        if (view.getVisibleSize().width > view.getVisibleSize().height) {
            console.log('当前是横屏');
            this.isLandscape = true;
        }
        else {
            console.log('当前是竖屏');
            this.isLandscape = false;
        }
    }

    private canvasResize() {
        CameraController.instance.lockEndPos(); // 调整摄像机位置
    }

    start() {

    }

    onDestroy() {
        // 移除监听
        view.off('canvas-resize', this.canvasResize, this);
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