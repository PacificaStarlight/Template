// UIManager.ts - 完整单文件实现
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
    // UI节点属性保持不变
    @property(Node)
    private UI_Start: Node = null;
    @property(Node)
    private level1_Hospital: Node = null;
    @property(Node)
    private level2_SuperMarket: Node = null;
    @property(Node)
    private level3_FurnitureStore: Node = null;
    @property(Node)
    private UI_Guide: Node = null;
    @property(Node)
    private UI_EndBanner: Node = null;

    // 按钮和其他属性保持不变
    @property(Button)
    private btn_Hospital: Button = null;
    @property(Button)
    private btn_SuperMarket: Button = null;
    @property(Button)
    private btn_FurnitureStore: Button = null;
    @property(Button)
    private btnSDK: Button[] = [];

    // UI管理相关属性
    private cd_ShowGuide: boolean = false;
    private waitTime: number = 5;
    private hideTime: number = 0;

    // 新增的UI管理属性
    private uiMap: Map<string, Node> = new Map();
    private activeUIPanels: Set<string> = new Set();

    // UI面板常量定义
    public static readonly UI_PANELS = {
        START: 'start',
        HOSPITAL: 'hospital',
        SUPERMARKET: 'supermarket',
        FURNITURE_STORE: 'furniture_store',
        GUIDE: 'guide',
        END_BANNER: 'end_banner'
    };

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
        if (this.cd_ShowGuide) {
            this.hideTime += deltaTime;
            if (this.hideTime > this.waitTime) {
                this.hideGuide(true);
            }
        }
    }

    // 初始化UI映射
    private initializeUIMap() {
        this.uiMap.set(UIManager.UI_PANELS.START, this.UI_Start);
        this.uiMap.set(UIManager.UI_PANELS.HOSPITAL, this.level1_Hospital);
        this.uiMap.set(UIManager.UI_PANELS.SUPERMARKET, this.level2_SuperMarket);
        this.uiMap.set(UIManager.UI_PANELS.FURNITURE_STORE, this.level3_FurnitureStore);
        this.uiMap.set(UIManager.UI_PANELS.GUIDE, this.UI_Guide);
        this.uiMap.set(UIManager.UI_PANELS.END_BANNER, this.UI_EndBanner);
    }

    init() {
        if (GameManager.instance.gameRunState == Constant.GAME_RUN_STATE.TESTING_GAMEOVER) {
            this.gameOver();
        } else {
            this.hideGuide(true);
            // 使用新方法初始化UI状态
            this.switchToUI(UIManager.UI_PANELS.START);
        }

        this.setupButtonEvents();
    }

    private setupButtonEvents() {
        this.btn_Hospital?.node.on(Button.EventType.CLICK, this.onHospitalClick, this);
        this.btn_SuperMarket?.node.on(Button.EventType.CLICK, this.onSuperMarketClick, this);
        this.btn_FurnitureStore?.node.on(Button.EventType.CLICK, this.onFurnitureStoreClick, this);

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
    /** 点击医院按钮 */
    onHospitalClick() {
        GameManager.instance.loadLevelData(1);
        this.switchToUI(UIManager.UI_PANELS.HOSPITAL);
    }

    /** 点击超市按钮 */
    onSuperMarketClick() {
        GameManager.instance.loadLevelData(2);
        this.switchToUI(UIManager.UI_PANELS.SUPERMARKET);
    }

    /** 点击家具店按钮 */
    onFurnitureStoreClick() {
        GameManager.instance.loadLevelData(3);
        this.switchToUI(UIManager.UI_PANELS.FURNITURE_STORE);
    }

    onSDKClick() {
        SDKManager.instance.clickDown();
    }

    /** 游戏结束 */
    private gameOver(isWin: boolean = false) {
        this.hideGuide();
        GameManager.instance.isGameOver = true;
        this.showUI(UIManager.UI_PANELS.END_BANNER);
        if (isWin) {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.SUCCESS_SFX);
        } else {
            AudioManager.playOneShot(Constant.AUDIO_TYPE.FAIL_SFX);
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