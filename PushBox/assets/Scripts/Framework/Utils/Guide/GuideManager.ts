import { _decorator, Component, Node, Animation, Vec2, Vec3, tween, Tween } from 'cc';
import { Board } from '../../../Board';
const { ccclass, property } = _decorator;
@ccclass('GuideManager')
export class GuideManager extends Component {

    private curIndex: number = 0;  //当前索引
    private initPos: Vec2 = new Vec2(4, 4);  //初始位置
    private array: number[][] = [];  //引导数组，获取引导坐标
    private girds: Node[][] = [];  //引导格子，获取引导位置
    private curAnim: Animation = null; //当前动画

    public posArray: Vec3[] = [];
    public isShow: boolean = false; //是否显示引导
    private isInitialized: boolean = false; // 是否已经初始化
    public static instance: GuideManager = null;
    onLoad() {
        GuideManager.instance = this;
    }

    start() {
        this.curAnim = this.node.getComponent(Animation);   // 获取动画
        this.girds = Board.instance.boardNode;  // 获取引导格子
        this.array = [];
        console.log("引导格子：")
        console.log(this.girds);
        console.log("引导数组：");
        console.log(this.array);
        // this.updateGuidePos();
    }

    onEnable() {
        if (this.isInitialized) {
            // console.log("GuideManager启用");
            // console.log(this.array); // 打印引导数组
            // this.initArray();
            // console.log(this.array); // 打印引导数组
        }
    }



    /** 初始化引导数组，在开始的时候使用一次 */
    public initArray() {
        this.array = [];
        let index = 0;
        this.isInitialized = true; // 标记已经初始化
        for (let i = 0; i < Board.instance.rows; i++) {
            this.array[i] = [];
            for (let j = 0; j < Board.instance.cols; j++) {
                // let block = Board.instance.getBlockByBoard(i, j);
                // let type = block.getComponent(Block).blockType;
                // this.array[i][j] = type;
                index++;
            }
        }
        // console.log("初始化引导数组，只是为了拷贝相应位置上方块类型的值，使得我能清晰的知道场上是什么情况，也许这意味着，我需要重新设计这个方法，因为它的功能没有达到预期");
        console.log(this.array);
        this.updateGuidePos(); // 更新引导位置
    }

    // 更新引导位置
    public updatePos() {
        // 获取array的行数和列数
        let row = this.array.length;
        let col = this.array[0].length;
        console.log("行数：" + row + " 列数：" + col);
        for (let i = 0; i < row; i++) {
            for (let j = 0; j < col; j++) {
                if (this.array[i][j] == this.curIndex) {
                    if (Board.instance.board[i][j] == 0) {
                        this.curIndex++;
                        i = -1;
                        j = -1;
                        break;
                    }
                    else {
                        this.node.setWorldPosition(this.girds[i][j].worldPosition);
                    }
                }
            }
        }
    }

    // 切换动画
    public changeAnim(index = 0) {
        if (index == 0) {
            this.curAnim.play();  //切换动画
        }
    }

    // 更新引导位置
    public updateGuidePos() {
        const result = this.findThreeOrMoreAdjacent(this.array);
        // console.log("找到的数字：", result);
        if (result == null) {
            console.log("没有找到三个或以上的相邻数字,再次加载初始化数组");
            // Board.instance.refreshBoard();
            return;
        }
        else {
            this.posArray = [];// 存储所有需要移动的方块的位置
            Tween.stopAll();
            // console.log("找到的数字：", result.positions);
            let posPath = this.filterAndReorderConnectedPoints(result.positions);
            let pos = this.filterPathByManhattan(posPath);

            // console.log("过滤后的位置：", posPath.length);
            console.log("过滤后的位置：", pos);
            for (let i = 0; i < pos.length; i++) {
                let trans = pos[i];
                let block = Board.instance.boardNode[trans[0]][trans[1]];
                let worldPos = block.worldPosition; // 更新位置
                this.posArray.push(worldPos);
            }
            let index = 0;
            this.node.worldPosition = this.posArray[index++];
            this.moveToPoints(this.posArray, index);  // 移动到下一个位置
        }
    }

    // 检查是否有三个或以上的相邻数字
    public checkDestroyBlock() {
        // this.array = [];
        // let index = 0;
        // this.isInitialized = true; // 标记已经初始化
        // for (let i = 0; i < Board.instance.rows; i++) {
        //     this.array[i] = [];
        //     for (let j = 0; j < Board.instance.cols; j++) {
        //         let block = Board.instance.getBlockByBoard(i, j);
        //         let type = block.getComponent(Block).blockType;
        //         this.array[i][j] = type;
        //         index++;
        //     }
        // }
        // const result = this.findThreeOrMoreAdjacent(this.array);
        // console.log("检查结果：", result);
        // if (result == null) {
        //     console.log("再次加载初始化数组");
        //     Board.instance.refreshBoard();
        //     // InputManager.instance.hideTime = 0; // 隐藏时间
        // }
    }

    // 移动节点
    public moveToPoints(posArray: Vec3[], index: number) {
        if (index <= posArray.length) {
            tween(this.node)
                .to(0.7, { worldPosition: posArray[index] }) // 移动到下一个位置
                .call(() => {
                    // console.log("移动到目标位置：", index);
                    index++;
                    this.moveToPoints(posArray, index);
                })
                .start();
        } else {
            index = 0;
            this.node.worldPosition = this.posArray[0];
            tween(this.node)
                .delay(0.5)
                .call(() => {
                    index++;
                    this.moveToPoints(this.posArray, index);
                })
                .start();
        }
    }

    /** 通过曼哈顿距离，过滤四向路径 */
    private filterPathByManhattan(path: number[][]): number[][] {
        if (path.length <= 2) return path;

        const result: number[][] = [path[0]];
        let i = 1;
        // result.push(path[0]);
        while (i < path.length) {
            const current = path[i];
            const last = result[result.length - 1];

            const dx = Math.abs(current[0] - last[0]);
            const dy = Math.abs(current[1] - last[1]);

            if (dx + dy == 1) {
                console.log(`相邻的节点: [${last}]\n相邻的节点: [${current}]`);
                result.push(current);
            }
            if (dx + dy == 0) {
                console.log(`相同的节点: [${last}]\n相同的节点: [${current}]`);
                result.pop();
                result.push(current);
            }
            if (dx + dy > 1) {
                console.log(`不相邻的节点: [${last}]\n不相邻的节点: [${current}]`);
                const latest = result[result.length - 2];
                const dis = Math.abs(latest[0] - current[0]) + Math.abs(latest[1] - current[1]);
                if (dis == 1) {
                    result.pop();
                    result.push(current);
                }
                else {
                    console.log('不加入后续元素');
                }
            }
            i++;
        }

        return result;
    }

    /** 核心查找方法：查找三个及以上相邻的相同数字(返回第一条找到的结果)*/
    private findThreeOrMoreAdjacent(grid: number[][]): { value: number, positions: [number, number][] } | null {
        const rows = grid.length;
        if (rows === 0) return null;
        const cols = grid[0].length;
        const visited = new Set<string>();

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const positionKey = `${i},${j}`;
                if (visited.has(positionKey)) continue;

                const currentValue = grid[i][j];
                const connectedGroup: [number, number][] = [];

                // DFS查找相连的相同数字
                this.dfsFindConnected(i, j, currentValue, grid, visited, connectedGroup);

                // 找到3个或以上的相邻数字，立即返回
                if (connectedGroup.length >= 3) {
                    return { value: currentValue, positions: connectedGroup };
                }
            }
        }
        return null;
    }

    /** 核心查找方法：查找所有三个及以上相邻的相同数字组*/
    private findAllThreeOrMoreAdjacent(grid: number[][]): { value: number, positions: [number, number][] }[] {
        const rows = grid.length;
        if (rows === 0) return [];
        const cols = grid[0].length;

        const visited = new Set<string>();
        const result: { value: number, positions: [number, number][] }[] = [];

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const positionKey = `${i},${j}`;
                if (visited.has(positionKey)) continue;

                const currentValue = grid[i][j];
                const connectedGroup: [number, number][] = [];

                // DFS查找相连的相同数字
                this.dfsFindConnected(i, j, currentValue, grid, visited, connectedGroup);

                // 找到3个或以上的相邻数字，添加到结果
                if (connectedGroup.length >= 3) {
                    result.push({
                        value: currentValue,
                        positions: connectedGroup
                    });
                }
            }
        }

        return result;
    }

    /** 核心查找方法：DFS递归查找相连的相同数字*/
    private dfsFindConnected(row: number, col: number, targetValue: number, grid: number[][], visited: Set<string>, result: [number, number][]): void {
        const rows = grid.length;
        const cols = grid[0].length;
        const positionKey = `${row},${col}`;

        if (row < 0 || row >= rows || col < 0 || col >= cols) return;
        if (visited.has(positionKey)) return;
        if (grid[row][col] !== targetValue) return;

        visited.add(positionKey);
        result.push([row, col]);

        // 四个方向搜索
        this.dfsFindConnected(row + 1, col, targetValue, grid, visited, result); // 下
        this.dfsFindConnected(row - 1, col, targetValue, grid, visited, result); // 上
        this.dfsFindConnected(row, col + 1, targetValue, grid, visited, result); // 右
        this.dfsFindConnected(row, col - 1, targetValue, grid, visited, result); // 左
    }

    /** 辅助功能：过滤并重新排序连通方块*/
    private filterAndReorderConnectedPoints(points: [number, number][]): [number, number][] {
        if (points.length <= 1) return points;

        // 1. 找到所有连通分量
        const components = this.findConnectedComponents(points);
        console.log('找到的连通分量:', components);

        // 2. 如果只有一个连通分量，直接重新排序
        if (components.length === 1) {
            return this.reorderToPath(components[0]);
        }
        // 3. 有多个连通分量，找到最大的
        const largestComponent = this.findLargestComponent(components);
        console.log('最大连通分量:', largestComponent);

        let endPoint = this.reorderToPath(largestComponent);
        // 5. 重新排序为连续路径
        return endPoint;
    }

    /** 辅助功能：找到所有连通分量 */
    private findConnectedComponents(points: [number, number][]): [number, number][][] {
        const graph = this.buildGraph(points);
        const visited = new Set<string>();
        const components: [number, number][][] = [];

        for (const point of points) {
            const key = `${point[0]},${point[1]}`;
            if (!visited.has(key)) {
                const component: [number, number][] = [];
                // this.dfsFindComponent(point[0], point[1], graph, visited, component);
                this.dfsBuildPath(point[0], point[1], graph, component, visited);
                components.push(component);
            }
        }
        return components;
    }

    /** 辅助功能：重新排序为连续路径 */
    private reorderToPath(points: [number, number][]): [number, number][] {
        if (points.length <= 2) return points;

        const graph = this.buildGraph(points);
        const path: [number, number][] = [];
        const visited = new Set<string>();

        // 找到端点（度数为1的点）或任意点
        let startPoint = points.find(p => {
            const key = `${p[0]},${p[1]}`;
            return graph.get(key)?.length === 1;
        }) || points[0];
        this.dfsBuildPath(startPoint[0], startPoint[1], graph, path, visited);
        return path;
    }

    /** 辅助功能：找到最大的连通分量 */
    private findLargestComponent(components: [number, number][][]): [number, number][] {
        if (components.length === 0) return [];
        return components.reduce((largest, current) =>
            current.length > largest.length ? current : largest, components[0]);
    }

    /** 辅助功能：构建邻接图 - 只检查上下左右*/
    private buildGraph(points: [number, number][]): Map<string, [number, number][]> {
        const graph = new Map();
        const pointSet = new Set(points.map(p => `${p[0]},${p[1]}`));

        for (const [x, y] of points) {
            const key = `${x},${y}`;
            graph.set(key, []);

            // 只检查上下左右四个方向
            const directions = [
                [-1, 0], [1, 0], [0, -1], [0, 1] // 上、下、左、右
            ];

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const neighborKey = `${nx},${ny}`;

                if (pointSet.has(neighborKey)) {
                    // 确保是直接相邻（曼哈顿距离为1）
                    const manhattanDistance = Math.abs(nx - x) + Math.abs(ny - y);
                    if (manhattanDistance == 1) {
                        graph.get(key)!.push([nx, ny]);
                    }
                }
            }
        }
        return graph;
    }


    /** DFS构建路径 */
    private dfsBuildPath(x: number, y: number, graph: Map<string, [number, number][]>, path: [number, number][], visited: Set<string>) {
        const key = `${x},${y}`;
        if (visited.has(key)) return;

        visited.add(key);
        path.push([x, y]);

        const neighbors = graph.get(key);
        if (neighbors) {
            for (const [nx, ny] of neighbors) {
                if (!visited.has(`${nx},${ny}`)) {
                    this.dfsBuildPath(nx, ny, graph, path, visited);
                }
            }
        }
    }
}