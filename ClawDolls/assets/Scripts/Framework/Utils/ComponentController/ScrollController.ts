import { _decorator, Component, instantiate, Node, randomRangeInt, ScrollView, sp, Tween, tween, UITransform, v2, v3, Vec3 } from 'cc';
import { CameraController } from './CameraController'

const { ccclass, property } = _decorator;

@ccclass('ScrollController')
export class ScrollController extends Component {
    @property(ScrollView)
    private scrollView: ScrollView = null;
    @property(Node)
    public content: Node = null;
    private itemCount: number = 14; // 固定为7个节点
    private itemHeight: number = 105; // 每个选项的高度
    private spacing: number = 20; // 选项之间的间隔

    private repeatCount: number = 3; // 重复内容的次数，确保无缝循环
    private contentHeight: number = 0; // 一个循环的高度

    private isTurning: boolean = false; // 是否正在转动
    private isDecelerating: boolean = false;
    private rollSpeed: number = 400;
    private maxSpeed: number = 0;
    public targetIndex: number = 0; // 目标索引
    private stopCallback: (() => void) | null = null;
    private circles: number = 3;    // 滚动的圈数
    private itemScale: Node[] = []; // 存储每个item的缩放比例
    private static stopCircles: number = 0;   // 滚动停止的圈数

    onLoad() {
        this.contentHeight = (this.itemCount) * (this.itemHeight + this.spacing);
        this.initContent();
    }

    start() {
        // 禁止ScrollView的滚动
        this.scrollView.enabled = false;
    }

    // 初始化内容方法
    private initContent() {
        //设置高
        this.content.getComponent(UITransform).height = this.contentHeight * 3; // 3圈高度
        this.scrollView.node.getComponent(UITransform).height = this.contentHeight;
        // console.log('scrollView总长度：' + this.scrollView.node.getComponent(UITransform).height);
        // 创建重复的内容
        for (let i = 1; i < this.repeatCount; i++) {
            for (let j = 0; j < this.itemCount; j++) {
                const item = instantiate(this.content.children[j]);
                this.content.addChild(item);
            }
        }
        this.randomPosition();
        this.content.children.forEach((item) => {
            let child = item.children[1].children[0];
            // console.log(item.children[0].children[0].scale);
            this.itemScale.push(child);
        }); // 存储每个item的缩放比例
        // console.log(this.content.children);
    }

    /** 设置随机高度位置 */
    public randomPosition() {
        // 对齐初始位置
        this.scrollView.scrollToOffset(v2(0, this.contentHeight), 0);
        // 随机选择一个目标索引
        const random = randomRangeInt(0, 7); // 随机选择一个目标索引
        const offset = random * (this.itemHeight + this.spacing)
        // 初始位置在原始区域顶部
        this.scrollView.scrollToOffset(v2(0, offset), 0);
    }

    // 开始滚动：初始化滚动状态并启动每帧更新
    public startRoll(initialSpeed: number, targetIndex: number, onComplete?: () => void) {
        if (this.isTurning) return; // 如果已经在滚动中，则不执行
        this.scrollView.enabled = true;
        this.isTurning = true;
        this.isDecelerating = false;
        this.targetIndex = targetIndex;
        this.maxSpeed = initialSpeed; // 初始速度（由外部传入）
        this.unschedule(this.updateRoll); // 取消之前的调度
        this.schedule(this.updateRoll, 0); // 每帧执行滚动更新
        this.stopCallback = onComplete; // 保存回调函数
    }

    public test() {
        console.log('test');
        console.log('抽中了' + (this.targetIndex + 1) + '号商品');
        console.log('抽中商品名称：' + this.content.children[this.targetIndex + 1].children[0].children[0].name);
    }

    // 每帧更新滚动状态
    private updateRoll(dt: number) {
        if (!this.isTurning || !this.scrollView) return;

        if (!this.isDecelerating) {
            // 自由滚动阶段：轻微加速至最大速度（上限1200）
            this.rollSpeed = Math.min(this.rollSpeed + 200, this.maxSpeed);
        }

        // 应用当前速度更新位置（y减小=向下滚动）
        let currentOffset = this.scrollView.getScrollOffset();
        currentOffset.y -= this.rollSpeed * dt;
        this.scrollView.scrollToOffset(currentOffset, 0);

        // 滚动过程中实时重置位置（避免触达边界被卡住）
        this.checkAndResetPositionDuringRoll();
    }

    /** 滚动过程中实时重置位置（解决无限滚动边界问题）*/
    private checkAndResetPositionDuringRoll() {
        if (!this.scrollView) return;
        const currentOffset = this.scrollView.getScrollOffset();
        // console.log('当前偏移量：' + Math.round(currentOffset.y) + ' ' + Math.round(this.contentHeight - this.spacing));
        // 向下滚动超过前复制区域（y <= 0）：重置到下一圈
        if (currentOffset.y <= 0) {
            this.scrollView.scrollToOffset(v2(0, currentOffset.y + this.contentHeight), 0);
            this.circles--;
            if (this.circles <= 0) {
                // 滚动结束回调
                this.unschedule(this.updateRoll);
                this.isDecelerating = true;
                // 确保事件唯一（先移除旧事件，再注册新事件）
                this.scrollView.node.off('scroll-ended', this.onScrollEnd, this);
                this.scrollView.node.once('scroll-ended', this.onScrollEnd, this);
                let targetY = this.targetIndex * (this.itemHeight + this.spacing);
                // 执行最终定位滚动
                this.scrollView.scrollToOffset(v2(0, targetY), 0.8); // 3秒内滚动到目标位置
                // }
            }
            // 向上滚动超过后复制区域（y >= 2*contentHeight）：重置到上一圈
            else if (currentOffset.y >= 2 * this.contentHeight) {
                this.scrollView.scrollToOffset(v2(0, currentOffset.y - this.contentHeight), 0);
            }
        }
    }

    // 滚动结束回调
    private onScrollEnd() {
        // 移除事件监听（避免重复触发）
        this.scrollView?.node.off('scroll-ended', this.onScrollEnd, this);
        // 最终位置重置（确保在原始区域）
        this.checkAndResetPosition();
        // console.log('抽中商品名称：' + this.content.children[this.targetIndex + 1].children[0].children[0].name);

        // 更新状态
        this.isDecelerating = false;
        this.circles = 3;
        this.scrollView.enabled = false;

        ScrollController.stopCircles++;
        this.checkRollStop(); // 检查滚动停止
        // 执行外部回调
        if (this.stopCallback) this.stopCallback();
    };

    // 滚动结束后重置位置（确保在原始区域）
    private checkAndResetPosition() {
        if (!this.scrollView) return;
        let currentOffset = this.scrollView.getScrollOffset();
        // 向下滚动超过底部：重置到原始区域
        if (currentOffset.y <= 0) {
            currentOffset.y += this.contentHeight;
            this.scrollView.scrollToOffset(currentOffset, 0);
        }
        // 向上滚动超过顶部：重置到原始区域
        else if (currentOffset.y >= 2 * this.contentHeight) {
            currentOffset.y -= this.contentHeight;
            this.scrollView.scrollToOffset(currentOffset, 0);
        }
    }

    // 重置选中项目大小
    public resetScale() {
        Tween.stopAllByTarget(this.itemScale[this.targetIndex + 1]);
        let target = this.itemScale[this.targetIndex + 1];
        let child = this.content.children[this.targetIndex + 1].children[1].children[0];
        child.scale = v3(target.scale.x, target.scale.x, target.scale.x);
        let spineLight = this.content.children[this.targetIndex + 1].children[0].getComponent(sp.Skeleton);
        spineLight.clearTracks();
        this.content.children[this.targetIndex + 1].children[0].active = false;
    }

    /** 检查滚动停止 */
    private checkRollStop() {
        this.isTurning = false;
        CameraController.instance.shakeCamera(0.05, 10);
        if (ScrollController.stopCircles >= 3) {

        }
    }
}