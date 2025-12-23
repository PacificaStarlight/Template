// UIManager.ts - 完整单文件实现
import { _decorator, Button, Component, Node } from 'cc';
import { GameManager } from './GameManager';
import { EventManager } from '../Framework/Common/Event/EventCenter';
import { SDKManager } from '../Framework/Utils/SDK/SDKManager';
import { AudioManager } from '../Framework/Common/Audio/AudioManager';
import { AppLovinEvent } from '../Framework/Utils/SDK/AppLovinEvent';
import { Constant } from './Constant';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    // UI节点属性保持不变
    @property(Node)
    private UI_Start: Node = null;
    @property(Node)
    private UI_Guide: Node = null;
    @property(Node)
    private UI_EndBanner: Node = null;

    // 按钮和其他属性保持不变
    @property(Button)
    private btnSDK: Button[] = [];

    // UI管理相关属性
    private cd_ShowGuide: boolean = true;
    private waitTime: number = 3;
    private hideTime: number = 0;

    isShowGuide: boolean = false; // 添加一个布尔值来跟踪是否显示引导

    // 新增的UI管理属性
    private uiMap: Map<string, Node> = new Map();
    private activeUIPanels: Set<string> = new Set();

    public targetNode: Node[] = [];

    // UI面板常量定义
    public static readonly UI_PANELS = {
        START: 'start',
        GUIDE: 'guide',
        END_BANNER: 'end_banner'
    };
    // 初始化UI映射
    private initializeUIMap() {
        this.uiMap.set(UIManager.UI_PANELS.START, this.UI_Start);
        this.uiMap.set(UIManager.UI_PANELS.GUIDE, this.UI_Guide);
        this.uiMap.set(UIManager.UI_PANELS.END_BANNER, this.UI_EndBanner);
    }

    public static instance: UIManager = null;
    onLoad() {
        UIManager.instance = this;
        this.initializeUIMap();
    }

    start() {
        this.init();
        EventManager.on(Constant.EVENT_TYPE.CHANGE_GUIDE, this.hideGuide, this);
        EventManager.on(Constant.EVENT_TYPE.GAME_OVER, this.gameOver, this);
    }

    onDestroy() {
        EventManager.off(Constant.EVENT_TYPE.CHANGE_GUIDE, this.hideGuide, this);
        EventManager.off(Constant.EVENT_TYPE.GAME_OVER, this.gameOver, this);
    }

    update(deltaTime: number) {
        if (this.isShowGuide) {
            if (this.cd_ShowGuide) {
                this.hideTime += deltaTime;
                if (this.hideTime > this.waitTime) {
                    this.hideGuide(true);
                }
            }
        }
    }

    //#region 初始化UI
    init() {
        if (GameManager.instance.gameRunState == Constant.GAME_RUN_STATE.GAMEOVER) {
            this.gameOver();
        } else {
            // 使用新方法初始化UI状态
            this.switchToUI(UIManager.UI_PANELS.START);
        }
        this.setupButtonEvents();
    }

    /** 设置按钮事件监听 */
    private setupButtonEvents() {
        this.btnSDK.forEach((btn) => {
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 1.1;
            btn.node.on(Button.EventType.CLICK, this.onSDKClick, this);
        });
    }
    //#endregion

    //#region UI管理核心方法
    // ==================== UI管理核心方法 ====================
    /** 显示指定UI面板 */
    public showUI(panelName: string) {
        const panel = this.uiMap.get(panelName);
        if (panel) {
            panel.active = true;
            this.activeUIPanels.add(panelName);
        } else {
            console.warn(`UI Panel ${panelName} not found`);
        }
    }
    /** 隐藏指定UI面板 */
    public hideUI(panelName: string) {
        const panel = this.uiMap.get(panelName);
        if (panel) {
            panel.active = false;
            this.activeUIPanels.delete(panelName);
        } else {
            console.warn(`UI Panel ${panelName} not found`);
        }
    }
    /** 切换指定UI面板的显示状态 */
    public toggleUI(panelName: string) {
        const panel = this.uiMap.get(panelName);
        if (panel) {
            panel.active = !panel.active;
            if (panel.active) {
                this.activeUIPanels.add(panelName);
            } else {
                this.activeUIPanels.delete(panelName);
            }
        }
    }
    /** 隐藏所有UI面板 */
    public hideAllUI() {
        this.uiMap.forEach((panel, name) => {
            panel.active = false;
        });
        this.activeUIPanels.clear();
    }
    /** 切换到指定UI面板 */
    public switchToUI(panelName: string) {
        this.hideAllUI();
        this.showUI(panelName);
    }
    /** 检查指定UI面板是否处于显示状态 */
    public isUIActive(panelName: string): boolean {
        return this.activeUIPanels.has(panelName);
    }
    //#endregion

    //#region 事件处理方法
    // ==================== 事件处理方法 ====================

    onSDKClick() {
        SDKManager.instance.clickDown();
    }
    //#endregion

    //#region 游戏逻辑相关方法
    // ==================== 游戏逻辑相关方法 ====================

    //#endregion

    //#region 其他
    /** 游戏结束 */
    private gameOver(isWin: boolean = false) {
        GameManager.instance.isGameOver = true;

        this.hideUI(UIManager.UI_PANELS.GUIDE);
        this.cd_ShowGuide = true;
        this.hideTime = 0;
        this.showUI(UIManager.UI_PANELS.END_BANNER);
        if (isWin) {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.SUCCESS_SFX);
            AppLovinEvent.SendEvent(AppLovinEvent.CHALLENGE_SOLVED);
        } else {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.FAIL_SFX);
            AppLovinEvent.SendEvent(AppLovinEvent.CHALLENGE_FAILED);
        }
    }

    /** 隐藏/显示 引导 */
    private hideGuide(orShow?: boolean) {
        if (GameManager.instance.isGameOver) return;

        if (orShow) {
            this.showUI(UIManager.UI_PANELS.GUIDE);
        } else {
            this.hideUI(UIManager.UI_PANELS.GUIDE);
        }
        this.cd_ShowGuide = !orShow;
        this.hideTime = 0;
    }
    //#endregion
}
