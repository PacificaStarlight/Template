import { _decorator, Component, instantiate, Node, NodePool, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PoolManager')
export class PoolManager extends Component {
    private static _dictPool: Map<string, NodePool> = new Map();
    private static _dictPrefab: Map<string, Prefab> = new Map();

    /**
     * 预生成对象池
     * @param prefab 预制体
     * @param nodeNum 节点数量
     * 使用——PoolManager.instance.prePool(prefab, 40);
     */
    public static prePool(prefab: Prefab, nodeNum: number) {
        const name = prefab.name;
        let pool = new NodePool();
        this._dictPool.set(name, pool);

        for (let i = 0; i < nodeNum; i++) {
            const node = instantiate(prefab);
            pool.put(node);
        }
    }

    /**
     * 根据预设从对象池中获取对应节点
     * @param prefab 预制体
     * @param parent 父节点
     */
    public static getNode(prefab: Prefab, parent: Node) {
        let name = prefab.name;

        // 检查是否是有效的 prefab
        if (!(prefab instanceof Prefab)) {
            console.warn('Invalid prefab provided');
            return null!;
        }

        this._dictPrefab.set(name, prefab);
        let node: Node = null!;

        if (this._dictPool.has(name)) {
            //已有对应的对象池
            let pool = this._dictPool.get(name)!;
            if (pool.size() > 0) {
                node = pool.get();
            } else {
                node = instantiate(prefab);
            }
        } else {
            //没有对应对象池，创建它
            let pool = new NodePool();
            this._dictPool.set(name, pool);
            node = instantiate(prefab);
        }

        node.parent = parent;
        node.active = true;
        return node;
    }

    /**
     * 将对应节点放回对象池中
     */
    public static putNode(node: Node) {
        if (!node) {
            return;
        }
        let name = node.name;
        let pool: NodePool = null;
        if (this._dictPool.has(name)) {
            //已有对应的对象池
            pool = this._dictPool.get(name)!;
        } else {
            //没有对应对象池，创建它
            pool = new NodePool();
            this._dictPool.set(name, pool);
        }

        pool.put(node);
        //console.log(this._dictPool)
    }

    /**
     * 根据名称，清除对应对象池
     */
    public static clearPool(name: string) {
        if (this._dictPool.has(name)) {
            let pool = this._dictPool.get(name)!;
            pool.clear();
            this._dictPool.delete(name);
        }
    }

    /**
     * 清除所有对象池
     */
    public static clearAllPool() {
        this._dictPool.forEach((pool) => {
            pool.clear();
        });
        this._dictPool.clear();
    }

    /**
     * 获取对象池当前大小
     */
    public static getPoolSize(name: string): number {
        if (this._dictPool.has(name)) {
            return this._dictPool.get(name)!.size();
        }
        return 0;
    }
}