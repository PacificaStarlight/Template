import { _decorator, Component, Node, Graphics, UITransform, Color, Vec3, Vec2 } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('GraphicsController')
export class GraphicsController extends Component {
    @property(Graphics)
    private graphics: Graphics = null;
    private uiTransform: UITransform = null;

    public static instance: GraphicsController = null;
    onLoad() {
        GraphicsController.instance = this;
    }

    start() {
        if (this.graphics == null) {
            console.error("Graphics组件未找到");
            return;
        }
        // 创建Graphics组件
        this.graphics.getComponent(Graphics); // 获取Graphics组件
        this.uiTransform = this.graphics.getComponent(UITransform); // 获取UI组件
    }

    /** 绘制两点之间的线条
     * @param startPos 起点坐标
     * @param endPos 终点坐标
     * @param width 线条宽度
     * @param color 线条颜色
     */
    public drawLine(startPos: Vec3, endPos: Vec3, width: number = 10, color: Color = Color.RED) {
        this.graphics.clear(); // 清除之前的绘制
        let startScreen = new Vec3(); // 获取屏幕坐标
        let endScreen = new Vec3(); // 获取屏幕坐标
        this.uiTransform.convertToNodeSpaceAR(startPos, startScreen);
        this.uiTransform.convertToNodeSpaceAR(endPos, endScreen);

        // 将3D坐标转换为2D坐标（如果需要）
        const start = new Vec2(startScreen.x, startScreen.y);
        const end = new Vec2(endScreen.x, endScreen.y);

        this.graphics.lineWidth = width;
        this.graphics.strokeColor = color;
        this.graphics.moveTo(start.x, start.y);
        this.graphics.lineTo(end.x, end.y);
        this.graphics.stroke();
    }

    /** 绘制两点之间的线条，不删除之前的绘制
     * @param startPos 起点坐标
     * @param endPos 终点坐标
     * @param width 线条宽度
     * @param color 线条颜色
     */
    public drawLineUnClear(startPos: Vec3, endPos: Vec3, width: number = 10, color: Color = Color.RED) {
        let startScreen = new Vec3(); // 获取屏幕坐标
        let endScreen = new Vec3(); // 获取屏幕坐标
        this.uiTransform.convertToNodeSpaceAR(startPos, startScreen);
        this.uiTransform.convertToNodeSpaceAR(endPos, endScreen);

        // 将3D坐标转换为2D坐标（如果需要）
        const start = new Vec2(startScreen.x, startScreen.y);
        const end = new Vec2(endScreen.x, endScreen.y);
        // 核心线条颜色
        this.graphics.lineWidth = width;
        this.graphics.strokeColor = color;
        this.graphics.moveTo(start.x, start.y);
        this.graphics.lineTo(end.x, end.y);
        this.graphics.stroke();
    }

    /** 绘制多条连接的线段
     * @param points 连接的点坐标数组
     * @param width 线条宽度
     * @param color 线条颜色
     */
    public drawConnectedLine(points: Vec3[], width: number = 10, color: Color = Color.RED) {
        this.graphics.clear(); // 清除之前的绘制
        if (points.length < 2) return;
        const firstPoint = points[0];
        const firstPointPos = new Vec3();
        this.uiTransform.convertToNodeSpaceAR(firstPoint, firstPointPos);

        this.graphics.lineWidth = 90;
        this.graphics.strokeColor = new Color(0, 100, 0, 20);
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();
    }

    private outlineWidth = 80; // 外发光线条宽度
    private innerLineWidth = 50;    // 内发光线条宽度
    private coreLineWidth = 30; // 核心线条宽度

    private outLineColor = new Color(100, 255, 100, 20);
    private innerLineColor = new Color(200, 255, 200, 100);
    private coreLineColor = new Color(0, 128, 0, 255);
    /** 定制绘制多条连接的线段
     * @param points 连接的点坐标数组
     * @param width 线条宽度
     * @param color 线条颜色
     */
    public drawConnectedLines(points: Vec3[]) {
        // console.log("绘制多条连接的线段");
        // console.log(points);
        this.graphics.clear(); // 清除之前的绘制
        if (points.length < 1) return;
        const firstPoint = points[0];
        const firstPointPos = new Vec3();
        this.uiTransform.convertToNodeSpaceAR(firstPoint, firstPointPos);

        // 外发光线条
        this.graphics.lineWidth = this.outlineWidth;
        this.graphics.strokeColor = this.outLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();

        // 内发光线条
        this.graphics.lineWidth = this.innerLineWidth;
        this.graphics.strokeColor = this.innerLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();

        // 核心线条颜色
        this.graphics.lineWidth = this.coreLineWidth;
        this.graphics.strokeColor = this.coreLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();
    }

    /** 绘制多条连接的线段
     * @param points 连接的点坐标数组
     * @param width 线条宽度
     * @param color 线条颜色
     */
    public drawConnectedLinesByIndex(points: Vec3[], index: number) {
        // console.log("绘制多条连接的线段");
        // console.log(points);
        this.graphics.clear(); // 清除之前的绘制
        if (points.length < 1) return;
        const firstPoint = points[0];
        const firstPointPos = new Vec3();
        this.uiTransform.convertToNodeSpaceAR(firstPoint, firstPointPos);

        // 外发光线条
        this.graphics.lineWidth = this.outlineWidth;
        this.graphics.strokeColor = this.outLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            if (i == index) break;
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();

        // 内发光线条
        this.graphics.lineWidth = this.innerLineWidth;
        this.graphics.strokeColor = this.innerLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            if (i == index) break;
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();

        // 核心线条颜色
        this.graphics.lineWidth = this.coreLineWidth;
        this.graphics.strokeColor = this.coreLineColor;
        this.graphics.moveTo(firstPointPos.x, firstPointPos.y);
        for (let i = 1; i < points.length; i++) {
            if (i == index) break;
            const point = points[i];
            let pointPos = new Vec3();
            this.uiTransform.convertToNodeSpaceAR(point, pointPos);
            this.graphics.lineTo(pointPos.x, pointPos.y);
        }
        this.graphics.stroke();
    }

    /**
     * 清除连线 
     */
    public clearLines() {
        this.graphics.clear(); // 清除连线
    }
}