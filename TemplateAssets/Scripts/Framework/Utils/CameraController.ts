import { _decorator, Camera, Component, Node, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {
    @property(Camera)
    public camera: Camera = null;

    // 开始运动节点
    @property(Node)
    private startMoveNode: Node = null;

    // 结束运动节点
    @property(Node)
    private endMoveNode: Node = null;

    public static instance: CameraController = null;
    private cameraTween: any = null; // 保存当前 tween 引用

    onLoad() {
        CameraController.instance = this;
    }

    start() {

    }

    update(deltaTime: number) {

    }

    /** 镜头运动 */
    public moveCamera() {
        if (!this.camera) {
            console.warn('摄像机未设置');
            return;
        }
        if (!this.startMoveNode || !this.endMoveNode) {
            console.warn('起始或结束节点未设置');
            return;
        }

        console.log('镜头运动');
        this.camera.node.setPosition(this.startMoveNode.position);
        // 停止之前的 tween
        if (this.cameraTween) {
            this.cameraTween.stop();
        }
        // 保存新的 tween 引用
        this.cameraTween = tween(this.camera.node)
            .to(3, { position: this.endMoveNode.position })
            .call(() => {
                console.log('镜头运动结束');
            })
            .start();
    }

    /** 加深镜头深度
     * 
     */
    public addDeepFov() {
        if (!this.camera) {
            console.warn('Camera is not assigned');
            return;
        }

        console.log('加深镜头深度');
        // 停止之前的 tween
        if (this.cameraTween) {
            this.cameraTween.stop();
        }
        // 保存新的 tween 引用
        this.cameraTween = tween(this.camera)
            .to(3, { orthoHeight: 1400 })
            .start();
    }

    /** 恢复镜头深度
     * 
     */
    public resetDeepFov() {
        if (!this.camera) {
            console.warn('Camera is not assigned');
            return;
        }

        console.log('恢复镜头深度');
        // 停止之前的 tween
        if (this.cameraTween) {
            this.cameraTween.stop();
        }
        // 保存新的 tween 引用
        this.cameraTween = tween(this.camera)
            .to(0.1, { orthoHeight: 1280 })
            .start();
    }

    /** 镜头抖动
     *  
     * @param duration 抖动时间, 默认0.05秒
     * @param magnitude 抖动幅度, 默认5
     */
    public shakeCamera(duration: number = 0.05, magnitude: number = 5) {
        if (!this.camera) {
            console.warn('Camera is not assigned');
            return;
        }

        console.log('镜头抖动');
        // 停止之前的 tween
        if (this.cameraTween) {
            this.cameraTween.stop();
        }
        // 保存新的 tween 引用
        this.cameraTween = tween(this.camera.node)
            .to(duration, { position: v3(0, 0, 0) })
            .to(duration, { position: v3(magnitude, 0, 0) })
            .to(duration, { position: v3(-magnitude, 0, 0) })
            .to(duration, { position: v3(0, magnitude, 0) })
            .to(duration, { position: v3(0, -magnitude, 0) })
            .to(duration, { position: v3(0, 0, 0) })
            .start();
    }
}