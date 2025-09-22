import { _decorator, Component, Node, Animation, AnimationClip, resources, AnimationState, tween, Vec3, Label, Tween, v3 } from 'cc';
import { Tools } from '../../Utils/Tools';
// AnimManager.ts

interface IAnimInfo {
    anim: Animation;    // 动画组件
    clip: AnimationClip;    // 动画剪辑
    loop: boolean;    // 是否循环
    speed: number;    // 播放速度
    priority: number; // 优先级
}

export class AnimManager {
    private static _animations: Map<string, Animation> = new Map();
    private static _tweens: Map<string, (() => void) | null> = new Map();
    private static _isInitialized: boolean = false;

    static {
        console.log("AnimManager初始化");
        this.init();
    }

    private static init() {
        if (this._isInitialized) {
            console.warn("AnimManager已经初始化过了");
            return;
        }

        const animNode = new Node();
        animNode.name = 'AnimManager';

        this._isInitialized = true;
        console.log("AnimManager初始化完成");
    }

    /**注册动画
     * 
     * @param key 动画名称
     * @param node 节点
     */
    public static registerAnim(key: string, node: Node) {
        let anim = node.getComponent(Animation);
        if (!anim) {
            anim = node.addComponent(Animation);
        }
        this._animations.set(key, anim);
    }

    /**移除动画
     * 
     * @param key 动画名称
     */
    public static remove(key: string) {
        this._animations.delete(key);
    }

    /**移除所有动画
     **/
    public static removeAll() {
        this._animations.clear();
    }

    /**播放指定节点动画
     * 
     * @param key 动画名称
     * @param clipName 动画剪辑名（可选）
     * @param loop 是否循环（默认false）
     * @param speed 播放速度（默认1.0）
     */
    public static playByNode(key: string, node: Node, clipName?: string, loop: boolean = false, speed: number = 1.0) {
        this.registerAnim(key, node); // 注册动画

        const anim = this._animations.get(key);
        if (!anim) {
            console.warn(`动画未注册: ${key}`);
            return null;
        }
        resources.load(clipName, AnimationClip, (err, clip) => {
            clip.wrapMode = loop ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Default;
            if (err) {
                console.error(`加载动画剪辑失败: ${clipName}`, err);
                return;
            }
            anim.addClip(clip);

            // 获取动画状态
            anim.getState(clip.name);
            const state = anim.getState(clip.name);
            if (state) {
                state.speed = speed;
            }

            anim.play(clip.name);
        });
    }

    /**停止动画
     * 
     * @param key 动画名称
     */
    public static stop(key: string) {
        const anim = this._animations.get(key);
        anim?.stop();
    }

    /**暂停动画
     * 
     * @param key 动画名称
     */
    public static pause(key: string) {
        const anim = this._animations.get(key);
        anim?.pause();
    }

    /**恢复动画
     * 
     * @param key 动画名称
     */
    public static resume(key: string) {
        const anim = this._animations.get(key);
        anim?.resume();
    }

    /**
     * 开始界面_开门动画
     */
    public static Anim_UIBegin_OpenDoor(node: Node) {
        let delayTime = 0.5;
        let moveTime = 2;
        let childOne = node.children[0];
        let childTwo = node.children[1];

        tween(childOne)
            .delay(delayTime)
            .to(moveTime, { position: new Vec3(-2560, 0, 0) })
            .start();
        tween(childTwo)
            .delay(delayTime)
            .to(moveTime, { position: new Vec3(2560, 0, 0) })
            .start();
    }

    /** 弹窗界面_显示隐藏动画 */
    public static Anim_UIPopUp_Tip(node: Node) {
        let delayTime = 0.5;
        let showTime = 2;

        let child = node.children[1];
        let scale = child.scale; // 获取子节点的scale属性
        tween(child)
            .delay(delayTime)
            .to(0, { scale: new Vec3(0, 0, 0) })
            .to(0.3, { scale: new Vec3(scale.x * 1.2, scale.y * 1.2, scale.z * 1.2) })
            .to(0.1, { scale: new Vec3(scale.x, scale.y, scale.z) })
            .delay(showTime)
            .to(0.1, { scale: new Vec3(scale.x * 1.2, scale.y * 1.2, scale.z * 1.2) })
            .to(0.1, { scale: new Vec3(0, 0, 0) })
            .call(() => {
                node.active = false;
            })
            .start();
    }

    /** 缩放物体大小
     * @param node 缩放的物体
     * @param scale 缩放大小
     * @param duration 缩放时间
     */
    public static scaleNode(node: Node, scale: number, duration: number = 1) {
        Tween.stopAllByTarget(node);
        tween(node)
            .to(duration, { scale: new Vec3(scale, scale, 1) })
            .start()
    }

    /** 缩放物体大小
     * @param node 缩放的物体
     * @param scale 缩放大小
     * @param duration 缩放时间
     */
    public static scaleV3Node(node: Node, scale: Vec3, duration: number = 1) {
        Tween.stopAllByTarget(node);
        tween(node)
            .to(duration, { scale: new Vec3(scale.x * 1.2, scale.y * 1.2, 1) })
            .delay(0.1)
            .to(duration, { scale: new Vec3(scale.x, scale.y, 1) })
            .call(() => {
                console.log('缩放结束'); // 动画结束后的回调函数
            })
            .start()
    }

    /** 循环缩放物体大小
     * @param node 缩放的物体
     * @param zoomFactor 缩放比例, 默认1.2
     * @param duration 缩放时间, 默认0.5
     */
    public static loopScaleNode(node: Node, zoomFactor: number = 1.2, duration: number = 0.5) {
        Tween.stopAllByTarget(node);
        tween(node)
            .to(duration, { scale: v3(node.scale.x * zoomFactor, node.scale.y * zoomFactor, node.scale.z) })
            .to(duration, { scale: v3(node.scale.x, node.scale.y, node.scale.z) })
            .union()
            .repeatForever()
            .start();
    }


    /** UI界面_数字增长 */
    // 更新数字
    public static updateNumber(label: Label, curNumber: number, targetNumber: number, duration: number = 1) {
        // 使用 Tween 实现数字动画
        tween(label.node)
            .to(duration, {}, {
                onUpdate: (target: Node, ratio: number) => {
                    const current = Math.floor(curNumber + (targetNumber - curNumber) * ratio);
                    label.string = Tools.formatNumber(current);
                },
                onComplete: () => {
                    label.string = Tools.formatNumber(targetNumber);
                }
            })
            .start();
        label.node.active = true;
    }
    // 更新数字
    public static updateProgress(label: Label, curNumber: number, targetNumber: number, duration: number = 1) {
        // 使用 Tween 实现数字动画
        tween(label.node)
            .to(duration, {}, {
                onUpdate: (target: Node, ratio: number) => {
                    const current = Math.round(curNumber + (targetNumber - curNumber) * ratio);
                    label.string = `${current}%`;
                },
                onComplete: () => {
                    const target = Math.round(targetNumber);
                    label.string = `${target}%`;
                }
            })
            .start();
    }
}