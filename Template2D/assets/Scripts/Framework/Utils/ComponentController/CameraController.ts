import { _decorator, Camera, Component, Enum, find, Node, Tween, tween, v3, Vec2, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('CameraController')
export class CameraController extends Component {
    @property(Camera)
    public mainCamera: Camera = null;

    @property({ type: Node, tooltip: '相机跟随的节点' })
    public followNode: Node = null;

    @property(Node)
    public UI_LayoutTop: Node = null;
    /** 开始运动节点 */
    @property({ type: Node, tooltip: '开始运动节点' })
    private startMoveNode: Node = null;
    /** 结束运动节点 */
    @property({ type: Node, tooltip: '结束运动节点' })
    private endMoveNode: Node = null;

    // 用于位置计算的临时变量
    private _tempPos: Vec3 = new Vec3();
    // 是否正在移动
    private _isMoving: boolean = true;

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
        view.on('canvas-resize', this.lockEndPos, this);
    }

    onDestroy() {
        // 移除监听
        view.off('canvas-resize', this.lockEndPos, this);
    }

    start() {
        this.getCamera();
        this.node.setWorldPosition(this.followNode.position);
    }
    update(deltaTime: number) {
    }

    lateUpdate(deltaTime: number) {
        if (this._isMoving) return; // 如果正在移动，则不执行跟随逻辑
        // 1. 检查目标是否存在
        if (!this.followNode) {
            return;
        }
        // 2. 获取目标节点的世界坐标
        this.followNode.getWorldPosition(this._tempPos);
        // 3. 只将目标的x和y坐标赋值给摄像机，保持摄像机原有的z轴坐标
        this.node.setWorldPosition(this._tempPos.x, this._tempPos.y, this.node.position.z);
        this.UI_LayoutTop.setWorldPosition(this._tempPos.x, this._tempPos.y, 0);
    }

    //#region 摄像机初始化
    /** 获取相机 */
    private getCamera() {
        if (this.mainCamera) {
            // 主摄像机已存在，可以在这里执行其他初始化操作
            console.log('主摄像机已就绪:', this.mainCamera.node.name);
        } else {
            // 尝试获取当前节点上的Camera组件
            this.mainCamera = this.getComponent(Camera);
            // 如果还是没有，则查找场景中的主摄像机
            if (!this.mainCamera) {
                let cameraNode = find('Main Camera');
                if (cameraNode) {
                    this.mainCamera = cameraNode.getComponent(Camera);
                }
            }
            if (this.mainCamera) {
                console.log('成功获取主摄像机:', this.mainCamera.node.name);
            } else {
                console.warn('未能找到主摄像机');
            }
        }
    }
    //#endregion

    //#region 镜头功能
    /** 镜头抖动
     *  
     * @param time 抖动时间, 默认0.1秒
     * @param magnitude 抖动幅度, 默认5
     */
    public shakeCamera(time: number = 0.1, magnitude: number = 5) {
        if (!this.mainCamera) {
            console.warn('Camera is not assigned');
            return;
        }
        let duration = 0.05;
        let cameraPos = this.mainCamera.node.position.clone(); // 获取世界坐标
        let offsetY1 = cameraPos.y + magnitude;
        let offsetY2 = cameraPos.y - magnitude;
        let offsetX1 = cameraPos.x - magnitude;
        let offsetX2 = cameraPos.x + magnitude;

        tween(this.mainCamera.node)
            .to(0, { position: v3(0, 0, 0) })
            .to(duration, { position: v3(offsetX1, 0, 0) })
            .to(duration, { position: v3(offsetX2, 0, 0) })
            .to(duration, { position: v3(0, offsetY1, 0) })
            .to(duration, { position: v3(0, offsetY2, 0) })
            .to(duration, { position: v3(0, 0, 0) })
            .call(() => {
                time -= duration; // 减少时间
                if (time > 0) {
                    this.shakeCamera(time, magnitude); // 递归调用
                }
            })
            .start();
    }
    /** 锁定结束位置 */
    private lockEndPos() {
        if (this.endMoveNode) {
            this.mainCamera.node.setPosition(this.endMoveNode.position);
        }
    }

    /** 镜头运动
     * @param stopDelay 停顿时间, 默认1
     * @param duration 运动时间, 默认3
     */
    public moveCamera(stopDelay: number = 1, duration: number = 1, callback1?: () => void) {
        console.log('镜头运动');
        this.mainCamera.node.setPosition(this.startMoveNode.position);
        this.UI_LayoutTop.setPosition(this.startMoveNode.position);

        let targetPos = new Vec3(this.endMoveNode.position.x, this.endMoveNode.position.y, this.mainCamera.node.position.z)
        Tween.stopAllByTarget(this.mainCamera.node);
        tween(this.mainCamera.node)
            .delay(stopDelay)
            .to(duration, { position: targetPos })
            .call(() => {
                console.log('镜头运动结束');
                this._isMoving = false; // 移动结束，取消标记
                callback1 && callback1();
            })
            .start();
        tween(this.UI_LayoutTop)
            .delay(stopDelay)
            .to(duration, { position: targetPos })
            .call(() => {
                console.log('UI_LayoutTop运动结束');
            })
            .start();
    }

    public tryToMoveCamera(endPos: Vec2, duration: number = 1, callback1?: () => void) {
        console.log('镜头运动');
        this._isMoving = true; // 标记为正在移动
        Tween.stopAllByTarget(this.mainCamera.node);
        tween(this.mainCamera.node)
            .delay(duration)
            .to(duration, { worldPosition: new Vec3(endPos.x, endPos.y, this.mainCamera.node.position.z) })
            .call(() => {
                this._isMoving = false; // 移动结束，取消标记
                callback1 && callback1(); // 执行回调函数
            })
            .start();
    }

    public tryToMoveCamera_BackAndForth(endPos: Vec2, duration: number = 1, callback1?: () => void, delay: number = 1, callback2?: () => void) {
        console.log('镜头运动');
        this._isMoving = true; // 标记为正在移动
        let startPos = this.mainCamera.node.worldPosition.clone();
        Tween.stopAllByTarget(this.mainCamera.node);
        tween(this.mainCamera.node)
            .to(duration, { worldPosition: new Vec3(endPos.x, endPos.y, this.mainCamera.node.position.z) })
            .call(() => {
                callback1 && callback1(); // 执行回调函数
            })
            .delay(delay)
            .to(duration, { worldPosition: new Vec3(startPos.x, startPos.y, this.mainCamera.node.position.z) })
            .call(() => {
                callback2 && callback2(); // 执行回调函数
                this._isMoving = false; // 移动结束，取消标记
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
    //#endregion
}