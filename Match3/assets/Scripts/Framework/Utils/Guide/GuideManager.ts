import { _decorator, Component, Node, Animation, Vec2, Vec3, tween, Tween } from 'cc';
import { InputManager } from '../../InputManager';
const { ccclass, property } = _decorator;
@ccclass('GuideManager')
export class GuideManager extends Component {

    private curIndex: number = 0;  //当前索引
    private array: number[][] = [];  //引导数组，获取引导坐标
    private girds: Node[][] = [];  //引导格子，获取引导位置
    private curAnim: Animation = null; //当前动画
    private board: Node[][] = [];

    public posArray: Vec3[] = [];
    public isShow: boolean = false; //是否显示引导
    public isInitialized: boolean = false; // 是否已经初始化
    public static instance: GuideManager = null;
    onLoad() {
        GuideManager.instance = this;
    }

    start() {
    }

    onEnable() {
        if (!this.isInitialized) return;
        // 获取当前棋盘的数据
        this.getArray();
        // 寻找可合体的方块
        this.checkDestroyBlock();
    }

    init() {
        this.isInitialized = true;
        // 获取当前棋盘的数据
        this.getArray();
        // 寻找可合体的方块
        this.checkDestroyBlock();
    }

    /** 获取引导数组，在显示的时候使用 */
    public getArray() {
        this.array = [];
        let nodes = InputManager.instance.block;
        for (let i = 0; i < 7; i++) {
            this.array[i] = [];
            this.board[i] = [];
            for (let j = 0; j < 4; j++) {
                this.array[i][j] = 0;
            }
        }
        for (let i = 0; i < nodes.length; i++) {
            let block = nodes[i];
            if (block.active == false) continue;
        }
        console.log(this.array);
        console.log(this.board);
    }

    // 检查是否有三个或以上的相邻数字
    public checkDestroyBlock() {
        const result = this.findTwoOrMoreAdjacent(this.array);
        console.log("检查结果：", result);
        if (result == null) {
            const results = this.findFirstSameNumberPairWithZeroPath(this.array); // 寻找相同数字并通过0路径相连的组合
            console.log("寻找相同数字并通过0路径相连的组合：", results);
            if (results == null) {
                console.log("没有可通过0路径连接的相同数字");
            } else {
                // console.log("找到了可通过0路径连接的相同数字");
                this.posArray = [];
                // 处理第一个匹配项作为引导提示
                for (let i = 0; i < results.path.length; i++) {
                    let pos = results.path[i];
                    let targetPos = this.board[pos[0]][pos[1]].worldPosition.clone();
                    this.posArray.push(targetPos);
                }
                this.updateGuidePos();
            }
        }
        else {
            // console.log("找到连续的数组");
            let pos0 = result.positions[0];
            let pos1 = result.positions[1];
            let targetPos0 = this.board[pos0[0]][pos0[1]].worldPosition.clone();
            let targetPos1 = this.board[pos1[0]][pos1[1]].worldPosition.clone();
            this.posArray = [];
            this.posArray.push(targetPos1);
            this.posArray.push(targetPos0);
            this.updateGuidePos();
        }
    }

    // 更新引导位置
    public updateGuidePos() {
        console.log("更新引导位置");
        console.log(this.posArray);
        let index = 0;
        this.node.worldPosition = this.posArray[index++];
        Tween.stopAllByTarget(this.node); // 停止所有与该节点相关的tween动画
        this.moveToPoints(this.posArray, index);  // 移动到下一个位置
    }

    // 移动节点
    public moveToPoints(posArray: Vec3[], index: number) {
        if (index <= posArray.length) {
            tween(this.node)
                .to(0.5, { worldPosition: posArray[index] }) // 移动到下一个位置
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
                .delay(0.3)
                .call(() => {
                    index++;
                    this.moveToPoints(this.posArray, index);
                })
                .start();
        }
    }

    // 切换动画
    public changeAnim(index = 0) {
        if (index == 0) {
            this.curAnim.play();  //切换动画
        }
    }

    //#region 寻找可消除的数组
    /**
     * 寻找第一对相同数字并通过0路径相连的组合
     * @param grid 当前游戏网格数据
     * @returns 第一个满足条件的配对及路径，如果没找到则返回null
     */
    public findFirstSameNumberPairWithZeroPath(grid: number[][]): { value: number, positions: [number, number][], path: [number, number][] } | null {
        const rows = grid.length;
        const cols = grid[0].length;
        const sameNumbersMap = new Map<number, [number, number][]>();

        // 收集所有非零数字及其位置
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = grid[i][j];
                if (value !== 0) {
                    if (!sameNumbersMap.has(value)) {
                        sameNumbersMap.set(value, []);
                    }
                    sameNumbersMap.get(value)!.push([i, j]);
                }
            }
        }

        // 对每个数字的所有位置两两比较
        for (const [value, positions] of sameNumbersMap) {
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const posA = positions[i];
                    const posB = positions[j];

                    const path = this.findZeroPath(grid, posA, posB);
                    if (path !== null) {
                        return {
                            value,
                            positions: [posA, posB],
                            path
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * 检查两点间是否存在全为0的路径，并返回路径
     * @param grid 当前游戏网格数据
     * @param start 起始点坐标 [row, col]
     * @param end 终止点坐标 [row, col]
     * @returns 路径节点数组，如果不存在有效路径则返回null
     */
    private findZeroPath(grid: number[][], start: [number, number], end: [number, number]): [number, number][] | null {
        const rows = grid.length;
        const cols = grid[0].length;
        const visited = new Set<string>();
        const queue: [number, number][] = [start];
        const predecessors = new Map<string, [number, number] | null>(); // 记录每个节点的前驱节点

        visited.add(`${start[0]},${start[1]}`);
        predecessors.set(`${start[0]},${start[1]}`, null);

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右四个方向

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;

            if (x === end[0] && y === end[1]) {
                // 找到终点，重构路径
                return this.reconstructPath(predecessors, start, end);
            }

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                    const key = `${nx},${ny}`;

                    // 如果是终点，则允许进入；如果是0且未访问过则入队
                    if ((nx === end[0] && ny === end[1]) ||
                        (grid[nx][ny] === 0 && !visited.has(key))) {
                        visited.add(key);
                        predecessors.set(key, [x, y]);
                        queue.push([nx, ny]);
                    }
                }
            }
        }
        return null; // 未找到路径
    }

    /**
     * 重构路径
     * @param predecessors 前驱节点映射
     * @param start 起始点
     * @param end 终点
     * @returns 完整路径
     */
    private reconstructPath(predecessors: Map<string, [number, number] | null>, start: [number, number], end: [number, number]): [number, number][] {
        const path: [number, number][] = [];
        let current: [number, number] | null = end;

        while (current !== null) {
            path.unshift(current); // 添加到路径开头
            current = predecessors.get(`${current[0]},${current[1]}`) || null;
        }

        return path;
    }

    /**
     * 寻找第一对相同数字并通过0路径相连的组合
     * @param grid 当前游戏网格数据
     * @returns 第一个满足条件的配对，如果没找到则返回null
     */
    public findFirstSameNumberPairWithZero(grid: number[][]): { value: number, positions: [number, number][] } | null {
        const rows = grid.length;
        const cols = grid[0].length;
        const sameNumbersMap = new Map<number, [number, number][]>();

        // 收集所有非零数字及其位置
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = grid[i][j];
                if (value !== 0) {
                    if (!sameNumbersMap.has(value)) {
                        sameNumbersMap.set(value, []);
                    }
                    sameNumbersMap.get(value)!.push([i, j]);
                }
            }
        }

        // 对每个数字的所有位置两两比较
        for (const [value, positions] of sameNumbersMap) {
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const posA = positions[i];
                    const posB = positions[j];

                    if (this.hasZeroPath(grid, posA, posB)) {
                        return {
                            value,
                            positions: [posA, posB]
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * 检查两点间是否存在全为0的路径
     * @param grid 当前游戏网格数据
     * @param start 起始点坐标 [row, col]
     * @param end 终止点坐标 [row, col]
     * @returns 是否存在有效路径
     */
    private hasZeroPath(grid: number[][], start: [number, number], end: [number, number]): boolean {
        const rows = grid.length;
        const cols = grid[0].length;
        const visited = new Set<string>();
        const queue: [number, number][] = [start];
        visited.add(`${start[0]},${start[1]}`);

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右四个方向

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;

            if (x === end[0] && y === end[1]) {
                return true;
            }

            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < rows && ny >= 0 && ny < cols) {
                    const key = `${nx},${ny}`;

                    // 如果是终点，则允许进入；如果是0且未访问过则入队
                    if ((nx === end[0] && ny === end[1]) ||
                        (grid[nx][ny] === 0 && !visited.has(key))) {
                        visited.add(key);
                        queue.push([nx, ny]);
                    }
                }
            }
        }

        return false;
    }

    /**
     * 寻找相同数字并通过0路径相连的组合
     * @param grid 当前游戏网格数据
     * @returns 所有满足条件的配对列表
     */
    public findSameNumberPairsWithZeroPath(grid: number[][]): { value: number, positions: [number, number][] }[] {
        const rows = grid.length;
        const cols = grid[0].length;
        const sameNumbersMap = new Map<number, [number, number][]>();

        // 收集所有非零数字及其位置
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const value = grid[i][j];
                if (value !== 0) {
                    if (!sameNumbersMap.has(value)) {
                        sameNumbersMap.set(value, []);
                    }
                    sameNumbersMap.get(value)!.push([i, j]);
                }
            }
        }

        const results: { value: number, positions: [number, number][] }[] = [];

        // 对每个数字的所有位置两两比较
        sameNumbersMap.forEach((positions, value) => {
            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    const posA = positions[i];
                    const posB = positions[j];

                    if (this.hasZeroPath(grid, posA, posB)) {
                        results.push({
                            value,
                            positions: [posA, posB]
                        });
                    }
                }
            }
        });

        return results;
    }
    //#endregion

    //#region 寻找n个或以上的相邻数字
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
    private findTwoOrMoreAdjacent(grid: number[][]): { value: number, positions: [number, number][] } | null {
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

                // 找到2个或以上的相邻数字，立即返回
                if (connectedGroup.length >= 2) {
                    return { value: currentValue, positions: connectedGroup };
                }
            }
        }
        return null;
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
        if (grid[row][col] == 0) return; // 0表示空格，不参与连通块计算
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
    //#endregion
}