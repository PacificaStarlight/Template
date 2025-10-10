import { _decorator, Animation, Button, Component, Label, Node } from 'cc';
import { GameManager } from './GameManager';
import { EventManager } from './Common/Event/EventCenter';
import { Constant } from './Constant';
import { SDKManager } from './Utils/SDK/SDKManager';
import { AudioManager } from './Common/Audio/AudioManager';
import { AnimManager } from './Common/Animation/AnimManager';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    // 引导UI
    @property(Node)
    private UI_Guide: Node = null;
    // 尾版UI
    @property(Node)
    private UI_EndBanner: Node = null;
    // 购买按钮
    @property(Button)
    private btnSDK: Button[] = [];

    // 单例模式
    public instance: UIManager = null;
    onLoad() {
        this.instance = this;
    }

    start() {
        this.init();
        EventManager.on(Constant.EVENT_TYPE.CHANGE_GUIDE, this.hideGuide, this); // 监听隐藏引导
        EventManager.on(Constant.EVENT_TYPE.GAME_OVER, this.gameOver, this); // 监听游戏结束
    }

    // 初始化
    init() {
        if (GameManager.instance.gameRunState == Constant.GAME_RUN_STATE.TESTING) { // 如果是测试模式，则不显示尾版
            this.gameOver();
        }
        else {
            this.hideGuide(true);
            this.UI_EndBanner.active = false;
        }
        this.btnSDK.forEach((btn) => {
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 1.1;
            btn.node.on(Button.EventType.CLICK, this.onShopNow, this);
        });
    }

    update(deltaTime: number) {

    }

    onDestroy() {
        EventManager.off(Constant.EVENT_TYPE.CHANGE_GUIDE, this.hideGuide, this);
        EventManager.off(Constant.EVENT_TYPE.GAME_OVER, this.gameOver, this);
    }

    // 点击商店按钮
    onShopNow() {
        SDKManager.instance.clickDown();
    }

    // 游戏结束
    private gameOver(isWin: boolean = false) {
        this.hideGuide();
        GameManager.instance.isGameOver = true;
        this.UI_EndBanner.active = true;
        if (isWin) {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.SUCCESS_SFX); // 播放胜利音效
        }
        else {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.FAIL_SFX);    // 播放失败音效
        }
    }

    // 隐藏或者打开引导
    private hideGuide(orShow?: boolean) {
        if (GameManager.instance.isGameOver) return;
        if (orShow) {
            this.UI_Guide.active = true;
            return;
        }
        this.UI_Guide.active = false;
    }
}