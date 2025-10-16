import { _decorator, Component, Node, macro, director, AudioClip, Enum, Prefab } from 'cc';
import { StateController } from './Utils/UIcontrol/StateController';
import { Constant } from './Constant';
import { ResourceManager } from './Common/Resource/ResourceManager';
import { PoolManager } from './Common/Pools/PoolManager';

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

    /** 预加载某文件夹下所有预制体
     * @param path 预制体路径
     * @param node 将存放预制体数组
     * @param number 预制体数量
     * @param callback 回调函数
     */
    public preloadAllRes(path: string, node: Prefab[], number: number, callback?: Function) {
        ResourceManager.loadAllRes(path, Prefab, (err: any, prefabs: Prefab[]) => {
            console.log(prefabs);
            prefabs.forEach(prefab => {
                PoolManager.prePool(prefab, number);
                node.push(prefab);
            });
        });
        callback && callback();
    }
}