import { _decorator, Component, Node, Size, UITransform, view, Widget } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('UIAdaptation')
export class UIAdaptation extends Component {
    @property({ tooltip: '是否保持宽高比' })
    private keepAspectRatio: boolean = true;
    // @property(Node)
    // private needAdapt: Node = null; // 需要适配的节点

    // @property({ tooltip: '设计分辨率' })
    private designResolution: Size = new Size();

    // 用于存储原始尺寸
    private originalSize: Size = new Size();


    onLoad() {
        // 保存原始尺寸
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            this.originalSize.set(uiTransform.width, uiTransform.height);
        }
        // 初始适配
        this.adaptBackground();
        // 监听屏幕尺寸变化
        view.on('canvas-resize', this.adaptBackground, this);
    }

    onDestroy() {
        // 移除监听
        view.off('canvas-resize', this.adaptBackground, this);
    }

    start() {
        // 自动获取引擎设计分辨率
        if (this.designResolution.width === 0 || this.designResolution.height === 0) {
            this.designResolution.set(view.getDesignResolutionSize().width, view.getDesignResolutionSize().height);
        }
        // console.log('设计分辨率:', this.designResolution);
        // 确保在开始时适配
        this.adaptBackground();
    }

    adaptBackground() {
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        // 获取可视区域尺寸
        const visibleSize = view.getVisibleSize();
        const designRatio = this.designResolution.width / this.designResolution.height;
        const screenRatio = visibleSize.width / visibleSize.height;

        // console.log('当前屏幕分辨率:', visibleSize);

        let ratioX = visibleSize.width / this.designResolution.width;
        let ratioY = visibleSize.height / this.designResolution.height;

        if (this.keepAspectRatio) {
            // 保持宽高比适配
            if (screenRatio > designRatio) {
                // 屏幕更宽，以高度为基准
                // uiTransform.height = visibleSize.height;
                // uiTransform.width = visibleSize.height * designRatio;

                uiTransform.setContentSize(visibleSize.width * ratioY, visibleSize.height * ratioX);
            } else {
                // 屏幕更高，以宽度为基准
                // uiTransform.width = visibleSize.width;
                // uiTransform.height = visibleSize.width / designRatio;
                uiTransform.setContentSize(visibleSize.width * ratioY, visibleSize.height * ratioX);
            }
        } else {
            // 拉伸填充整个屏幕
            uiTransform.width = visibleSize.width;
            uiTransform.height = visibleSize.height;
        }

        // 如果有Widget组件，需要更新对齐
        const widget = this.node.getComponent(Widget);
        if (widget) {
            widget.updateAlignment();
        }
    }

    // 在编辑器中实时预览
    update() {
        if (EDITOR) {
            this.adaptBackground();
        }
    }
}