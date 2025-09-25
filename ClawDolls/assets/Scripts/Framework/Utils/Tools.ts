import { _decorator, Component, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tools')
export class Tools {

    /** 千分位数字格式化 */
    public static formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    /** 获取图片显示范围坐标
     * worldBounds 包含以下属性:
     * x: 世界坐标中矩形左下角的x坐标
     * y: 世界坐标中矩形左下角的y坐标
     * width: 矩形的宽度
     * height: 矩形的高度
     * @param node 图片节点
     */
    public static getImageRange(node: Node): { left: number, right: number, bottom: number, top: number } {
        const uiTransform = node.getComponent(UITransform);
        const worldBounds = uiTransform.getBoundingBoxToWorld();
        // 具体的边界坐标点
        const left = worldBounds.x;
        const right = worldBounds.x + worldBounds.width;
        const bottom = worldBounds.y;
        const top = worldBounds.y + worldBounds.height;
        return { left, right, bottom, top };
    }


    /** 随机整数
     * 
     * @param min 最小值
     * @param max 最大值
     */
    public static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /** 随机布尔值
     * 
     */
    public static randomBool(): boolean {
        return Math.random() > 0.5;
    }

    /** 随机浮点数
     * 
     */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
}