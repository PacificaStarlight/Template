import { _decorator, Camera, Component, find, Node, Tween, tween, v3, view } from 'cc';
import { InputManager } from '../../InputManager';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {
    @property(Camera)
    public mainCamera: Camera = null;
    @property(Node)
    public UI_LayoutTop: Node = null;

    // 开始运动节点
    @property(Node)
    private startMoveNode: Node = null;

    // 结束运动节点
    @property(Node)
    private endMoveNode: Node = null;
    // @property(Node)
    private endMoveNode1: Node = null; // 结束运动节点1

    public static instance: CameraController = null; // 单例
    onLoad() {
        CameraController.instance = this;
        // 如果没有在属性检查器中赋值，则尝试获取当前节点上的Camera组件
        if (!this.mainCamera) {
            this.mainCamera = this.getComponent(Camera);
        }
        // 如果还是没有，则查找场景中的主摄像机
        if (!this.mainCamera) {
            let cameraNode = find('Main Camera');
            if (cameraNode) {
                this.mainCamera = cameraNode.getComponent(Camera);
            }
        }
    }

    start() {
        let stopDelay = 0.5;
        let duration = 1.5;
        InputManager.instance.startAnim(stopDelay, duration); // 开始动画
        this.mainCamera.node.setPosition(this.startMoveNode.position);
        this.UI_LayoutTop.setPosition(this.startMoveNode.position);
        this.moveCamera(stopDelay, duration); // 镜头运动
    }

    /** 锁定结束位置 */
    public lockEndPos() {
        if (this.endMoveNode) {
            this.scheduleOnce(() => {
                this.mainCamera.node.setPosition(this.endMoveNode.position);
            }, 0.2); // 延迟0.2秒执行
        }
    }

    /** 镜头运动
     * @param stopDelay 停顿时间, 默认1
     * @param duration 运动时间, 默认3
     */
    public moveCamera(stopDelay: number = 1, duration: number = 1) {
        console.log('镜头运动');
        Tween.stopAllByTarget(this.mainCamera.node);
        tween(this.mainCamera.node)
            .delay(stopDelay)
            .to(duration, { position: this.endMoveNode.position })
            .call(() => {
                console.log('镜头运动结束');
            })
            .start();
        tween(this.UI_LayoutTop)
            .delay(stopDelay)
            .to(duration, { position: this.endMoveNode.position })
            .call(() => {
                console.log('UI_LayoutTop运动结束');
            })
            .start();
    }

    /** 加深镜头深度
     * @param duration 镜头运动时间
     * @param fov 镜头深度
     */
    public addDeepFov(duration: number = 1, fov: number = 1400) {
        if (!this.mainCamera) {
            console.warn('Camera is not assigned');
            return;
        }
        console.log('加深镜头深度');
        tween(this.mainCamera)
            .to(duration, { orthoHeight: fov })
            .start();
    }

    /** 镜头抖动
     *  
     * @param duration 抖动时间, 默认0.05秒
     * @param magnitude 抖动幅度, 默认5
     */
    public shakeCamera(duration: number = 0.05, magnitude: number = 5) {
        if (!this.mainCamera) {
            console.warn('Camera is not assigned');
            return;
        }

        console.log('镜头抖动');
        tween(this.mainCamera.node)
            .to(duration, { position: v3(0, 0, 0) })
            .to(duration, { position: v3(magnitude, 0, 0) })
            .to(duration, { position: v3(-magnitude, 0, 0) })
            .to(duration, { position: v3(0, magnitude, 0) })
            .to(duration, { position: v3(0, -magnitude, 0) })
            .to(duration, { position: v3(0, 0, 0) })
            .start();
    }
}