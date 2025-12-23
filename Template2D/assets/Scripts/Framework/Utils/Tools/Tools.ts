import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Tools')
export class Tools {

    /** 千分位数字格式化 */
    public static formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * 随机整数
     * @param min 最小值
     * @param max 最大值
     */
    public static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * 随机布尔值
     */
    public static randomBool(): boolean {
        return Math.random() > 0.5;
    }

    /**
     * 随机浮点数
     */
    public static randomFloat(min: number, max: number): number {
        return Math.random() * (max - min) + min;
    }
}