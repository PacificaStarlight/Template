// EventManager.ts
import { _decorator } from 'cc';

export class EventManager {
    private static eventListeners: Map<string, Array<{ callback: Function, target?: any }>> = new Map();

    /**
     * 监听事件
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    public static on(eventName: string, callback: Function, target?: any): void {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName)?.push({ callback, target });
    }

    /**
     * 取消监听事件
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    public static off(eventName: string, callback?: Function, target?: any): void {
        if (!this.eventListeners.has(eventName)) {
            return;
        }

        if (!callback) {
            this.eventListeners.delete(eventName);
            return;
        }

        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            for (let i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].callback === callback && (!target || listeners[i].target === target)) {
                    listeners.splice(i, 1);
                }
            }
        }
    }

    /**
     * 触发事件
     * @param eventName 事件名称
     * @param args 传递的参数
     */
    public static emit(eventName: string, ...args: any[]): void {
        if (!this.eventListeners.has(eventName)) {
            return;
        }

        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            // 复制一份，防止在回调中修改原数组
            const tempListeners = listeners.slice();
            for (const listener of tempListeners) {
                try {
                    listener.callback.call(listener.target, ...args);
                } catch (error) {
                    console.error(`EventManager emit error: ${error}`, eventName);
                }
            }
        }
    }

    /**
     * 一次性监听
     * @param eventName 事件名称
     * @param callback 回调函数
     * @param target 回调目标
     */
    public static once(eventName: string, callback: Function, target?: any): void {
        const onceCallback = (...args: any[]) => {
            this.off(eventName, onceCallback, target);
            callback.call(target, ...args);
        };
        this.on(eventName, onceCallback, target);
    }

    /**
     * 移除所有事件监听
     */
    public static removeAllListeners(): void {
        this.eventListeners.clear();
    }
}