import { _decorator, Component, Node, Animation, AnimationClip, resources, AnimationState } from 'cc';
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
    public static register(key: string, node: Node) {
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
        this.register(key, node); // 注册动画

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
}