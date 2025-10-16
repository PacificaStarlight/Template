import { view, macro, ResolutionPolicy, director } from 'cc';
import { _decorator, Component } from 'cc';
import { CCBoolean } from 'cc';
import { sys } from 'cc';

// import { Global } from '../../framework/Global';

const { ccclass, property } = _decorator;
const designSize = view.getDesignResolutionSize();
const ratio = 1.5;//Math.round(16 / 9 * 100) / 100;
@ccclass('CanvasAdapter')
export class CanvasAdapter extends Component {

    @property(CCBoolean)
    isNotNeedAdapter: boolean = false;

    private _adapter: () => void = null;

    onLoad() {
        this._adapter = this.isNotNeedAdapter ? this.setAdapter2 : this.setAdapter;
        view.on('canvas-resize', this._adapter, this);
    }

    protected start(): void {
        //this.setAdapter();
        this._adapter();
    }

    setAdapter() {
        let visibleSize = view.getVisibleSize();
        // Global.isIpad = false;
        if (visibleSize.height > visibleSize.width) { // 竖屏

            const r = visibleSize.height / visibleSize.width;

            if (r > ratio) {//普通手机
                if (visibleSize.width / visibleSize.height > 9 / 16) {
                    view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_HEIGHT);//9/15
                } else {
                    view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_WIDTH);
                }

            } else {//平板 
                view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_HEIGHT);
                // Global.isIpad = true;
            }

            director.emit('canvas-resize-complete', macro.ORIENTATION_PORTRAIT);

        } else { // 横屏

            const r = visibleSize.width / visibleSize.height;

            if (r < ratio) {//平板 
                view.setDesignResolutionSize(designSize.height, designSize.width, ResolutionPolicy.FIXED_WIDTH);
                // Global.isIpad = true;
            } else {//普通手机

                if (visibleSize.width / visibleSize.height < 16 / 9) {
                    view.setDesignResolutionSize(designSize.height, designSize.width, ResolutionPolicy.FIXED_WIDTH);//15/9
                } else {
                    view.setDesignResolutionSize(designSize.height, designSize.width, ResolutionPolicy.FIXED_HEIGHT);
                }
            }

            director.emit('canvas-resize-complete', macro.ORIENTATION_LANDSCAPE);
        }

        // Global.debug && console.log('sample junde isIpad', Global.isIpad);
    }

    setAdapter2() {
        let visibleSize = view.getVisibleSize();
        let designSize = view.getDesignResolutionSize();
        if (visibleSize.height / visibleSize.width > designSize.height / designSize.width) { // 竖屏
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_WIDTH);
        } else { // 横屏
            view.setDesignResolutionSize(designSize.width, designSize.height, ResolutionPolicy.FIXED_HEIGHT);
        }
    }

    /**
     * 判断是否是平板
     */
    isIpad(): boolean {
        const platform = sys.platform;
        const isIOS = platform === sys.Platform.IOS;
        const isBrowser = sys.isBrowser;

        if (isIOS) {
            // 在浏览器环境下，使用 userAgent 判断
            if (isBrowser) {
                return /iPad/.test(navigator.userAgent);
            }
            // 原生环境下，平台是 iOS 且通常是 iPad（但 iPhone 也返回 IOS）
            // 需要进一步判断
            else {
                // 原生 iOS 平台下，无法直接区分 iPhone/iPad
                // 需要桥接原生代码（见下方扩展）
                return false; // 默认返回 false，建议用原生桥接
            }
        }
        return false;
    }

    isIPhone(): boolean {
        //const platform = sys.platform;
        //const isIOS = platform === sys.Platform.IOS;
        const isBrowser = sys.isBrowser;

        //if (isIOS) {
        // 在浏览器环境下，使用 userAgent 判断
        if (isBrowser) {
            return /iPhone/.test(navigator.userAgent);
        }
        //}
        return false;
    }
}


