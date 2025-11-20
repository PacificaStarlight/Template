import { _decorator, Component, Enum, Node, Size, UITransform, view, Widget } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, property } = _decorator;

export enum UIAdaptationType {
    /** 不保持宽高比 */
    Always,
    /** 保持宽高比 */
    KeepAspectRatio,
    /** 根据宽度缩放背景 */
    ScaleBgAccordingToWidth,
    /** 根据高度缩放背景 */
    ScaleBgAccordingToHeight,
    /** 背景适配 */
    BgAdaptation,
}

@ccclass('UIAdaptation')
export class UIAdaptation extends Component {
    @property({ type: Enum(UIAdaptationType), tooltip: '适配模式' })
    private adaptationType: UIAdaptationType = UIAdaptationType.KeepAspectRatio;
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

    /** 适配背景
     * @returns 获取设计分辨率
     */
    adaptBackground() {
        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) return;

        // 获取可视区域尺寸
        const visibleSize = view.getVisibleSize();
        const designRatio = this.designResolution.width / this.designResolution.height;
        const screenRatio = visibleSize.width / visibleSize.height;

        let ratioX = visibleSize.width / this.designResolution.width;
        let ratioY = visibleSize.height / this.designResolution.height;

        // console.log('当前屏幕分辨率:', visibleSize + ' 缩放率:', ratioX, ratioY);
        // console.log(uiTransform.width, uiTransform.height);

        switch (this.adaptationType) {
            case UIAdaptationType.Always:
                // 拉伸填充整个屏幕
                uiTransform.width = visibleSize.width;
                uiTransform.height = visibleSize.height;
                break;
            case UIAdaptationType.KeepAspectRatio:
                // 保持宽高比适配
                if (screenRatio > designRatio) {
                    // 屏幕更宽，以高度为基准
                    uiTransform.setContentSize(visibleSize.width * ratioY, visibleSize.height * ratioX);
                } else {
                    // 屏幕更高，以宽度为基准
                    uiTransform.setContentSize(visibleSize.width * ratioY, visibleSize.height * ratioX);
                }
                break;
            case UIAdaptationType.ScaleBgAccordingToWidth:
                if (view.getVisibleSize().width > this.node.getComponent(UITransform).width) {
                    let ratio = view.getVisibleSize().width / this.node.getComponent(UITransform).width; // 计算缩放比例
                    this.node.getComponent(UITransform).setContentSize(this.node.getComponent(UITransform).width * ratio,
                        this.node.getComponent(UITransform).height * ratio);
                }
                break;
            case UIAdaptationType.ScaleBgAccordingToHeight:
                this.node.getComponent(UITransform).setContentSize(visibleSize.width * ratioY, visibleSize.height * ratioY);
                if (view.getVisibleSize().height > this.node.getComponent(UITransform).height) {
                    let ratio = view.getVisibleSize().height / this.node.getComponent(UITransform).height; // 计算缩放比例
                    this.node.getComponent(UITransform).setContentSize(this.node.getComponent(UITransform).width * ratio,
                        this.node.getComponent(UITransform).height * ratio);
                }
                break;
            case UIAdaptationType.BgAdaptation:
                // 基于原始尺寸进行缩放，避免累积效应
                let ratioBg = 1;
                let imageSide = 0;

                if (this.originalSize.width >= this.originalSize.height) {
                    imageSide = this.originalSize.height;
                } else {
                    imageSide = this.originalSize.width;
                }

                if (visibleSize.width >= visibleSize.height) {
                    // 横屏情况
                    ratioBg = visibleSize.width / imageSide;
                } else {
                    // 竖屏情况
                    ratioBg = visibleSize.height / imageSide;
                }
                // console.log('缩放比例:', ratioBg);
                // 使用原始尺寸乘以比率，而不是当前尺寸
                uiTransform.width = this.originalSize.width * ratioBg;
                uiTransform.height = this.originalSize.height * ratioBg;
                break;
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