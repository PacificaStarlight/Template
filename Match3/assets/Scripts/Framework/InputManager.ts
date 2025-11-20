import { _decorator, Component, Node, Vec2, Vec3, Input, input, EventTouch, UITransform, Button, tween, Tween, Prefab, instantiate } from 'cc';
import { EventManager } from './Common/Event/EventCenter';
import { Constant, RES_PATH } from './Constant';
import { GameManager } from './GameManager';
import { SDKManager } from './Utils/SDK/SDKManager';
import { GuideManager } from './Utils/Guide/GuideManager';
import { AudioManager } from './Common/Audio/AudioManager';
import { Block } from '../Block';
import { ResourceManager } from './Common/Resource/ResourceManager';
const { ccclass, property } = _decorator;
const tempV2 = new Vec2();
const tempV3 = new Vec3();
const moveDelay = 0.2;
const moveTime = 0.3;
@ccclass('InputManager')
export class InputManager extends Component {
    /** block，card，chess，node，child之类的 
     * 存储块的索引(block，card，node，child之类的)
     */
    public block: Node[] = [];     // 块
    private blockData: number[][] = []; // 块数据
    /**board，List，Node[]之类的
     * 存储块的索引(board，List，Node[]之类的)
     */
    private board: Node[] = [];     // 棋盘
    private boardData: Node[][] = [];     // 棋盘

    private firChoose_Block: Node = null; // 当前选中的棋子节点
    private secChoose_Block: Node = null; // 第二选中的棋子节点
    // private firChoose_Board: Node = null; // 当前选中的棋盘节点
    // private secChoose_Board: Node = null; // 第二选中的棋盘节点
    private chooseIndex = 0;
    // private touchStartPos: Vec2 = null; // 记录触摸开始位置
    // private startPos: Vec3 = null; // 记录触摸开始位置
    // private startParent: Node = null; // 记录触摸开始位置
    private isFirstTouch: boolean = true; // 是否是第一次触摸
    private isOver: boolean = false; // 是否结束
    private isMoving: boolean = false; // 是否正在移动

    // 单例模式
    public static instance: InputManager;

    onLoad() {
        InputManager.instance = this; // 单例模式
        // 监听触摸事件
        this.startListening();
    }
    start() {
        EventManager.on(Constant.EVENT_TYPE.PLAY_BGM, this.playBGM, this);
    }
    onDestroy() {
        this.cancelListening();
        EventManager.off(Constant.EVENT_TYPE.PLAY_BGM, this.playBGM, this);
    }

    update(deltaTime: number) {
    }
    //#region 初始化数据
    /** 获取棋盘信息 */
    public getBoardNode(board: Node[], boardList: Node[][]) {
        this.board = board;
        this.boardData = boardList;
        console.log('输入管理器获取棋盘信息：')
        console.log(this.board);
    }
    /** 获取棋子信息 */
    public getBlockNode(block: Node[]) {
        this.block = block;
        console.log('输入管理器获取块信息：')
        console.log(this.block);
        this.blockData = [];
        for (let i = 0; i < GameManager.instance.curBoard.x; i++) {
            this.blockData[i] = [];
            for (let j = 0; j < GameManager.instance.curBoard.y; j++) {
                this.blockData[i][j] = 0;
            }
        }
        for (let i = 0; i < this.block.length; i++) {
            let block = this.block[i];
            let transform = block.getComponent(Block).transform;
            let type = block.getComponent(Block).type;
            this.blockData[transform.x][transform.y] = type;
        }
        console.log(this.blockData); // 打印块数据
    }

    //#endregion

    //#region 触摸事件 Touch
    // 触摸开始事件
    onTouchStart(event: EventTouch) {
        // console.log('开始触摸');
        // this.touchStartPos = event.getLocation();
        this.releaseTempVar(); // 释放临时变量
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.hideGuide(); // 隐藏引导
        this.onStartDrag(); // 开始拖动
    }

    // 触摸移动事件
    onTouchMove(event: EventTouch) {
        if (GameManager.instance.isGameOver) return;
        // console.log('触摸移动');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.hideGuide(); // 隐藏引导
        this.onStartDrag(); // 开始拖动
    }

    // 触摸结束事件
    onTouchEnd(event: EventTouch) {
        if (GameManager.instance.isGameOver) {
            SDKManager.instance.clickDown();
            return;
        }
        // console.log('触摸结束 ');
        let worldPos = event.getUILocation(tempV2);
        tempV3.set(worldPos.x, worldPos.y, 0);
        this.onFinishDrag(); // 结束拖动
        // // 是否是第一次触摸
        // this.playBGM();
        // // 显示引导
        // if (!this.cd_ShowGuide) {
        //     EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE);     // 显示引导
        //     this.cd_ShowGuide = true;
        // }
        this.releaseTempVar(); // 释放临时变量
    }

    // 释放临时变量
    private releaseTempVar() {
        this.firChoose_Block = null;
        this.secChoose_Block = null;
        // this.firChoose_Board = null;
        // this.secChoose_Board = null;
        // this.touchStartPos = null;
    }

    // 开始拖动
    private onStartDrag() {
        if (this.isMoving) return;
        let targetBlock = this.block; // 获取块
        if (this.firChoose_Block == null) {
            for (let i = 0; i < targetBlock.length; i++) {
                const block = targetBlock[i];
                this.chooseIndex = i;
                const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 判断是否包含块
                if (isContain) {
                    this.firChoose_Block = block;
                    this.firChoose_Block.setSiblingIndex(this.block.length - 1); // 设置块的层级
                    console.log('第一选中的块 ' + this.firChoose_Block.name + ' ' +
                        this.firChoose_Block.getComponent(Block).type
                    ); // 获取块的名字

                    this.firChoose_Block.scale = new Vec3(1.1, 1.1, 1); // 设置块的大小
                    console.log(this.firChoose_Block.getComponent(Block).transform); // 获取块的位置
                    break;
                }
            }
        }
        else {
            // 块节点
            if (this.secChoose_Block == null) {
                for (let i = 0; i < targetBlock.length; i++) {
                    if (i == this.chooseIndex) continue;
                    const block = targetBlock[i];
                    const isContain = block.getComponent(UITransform).getBoundingBoxToWorld().contains(tempV2); // 获取块的位置
                    if (isContain) {
                        this.secChoose_Block = block;
                        console.log('第二选中的块: ' + this.secChoose_Block.name + ' '
                            + this.secChoose_Block.getComponent(Block).type
                        );
                        this.secChoose_Block.scale = new Vec3(1.1, 1.1, 1); // 设置块的大小
                        console.log(this.secChoose_Block.getComponent(Block).transform);
                        this.tryToMove(this.firChoose_Block, this.secChoose_Block); // 尝试移动
                    }
                }
            }
        }
    }

    // 结束拖动
    private onFinishDrag() {
        const targetBlock = this.block; // 获取块
        if (this.firChoose_Block != null) {
            this.firChoose_Block.scale = new Vec3(1, 1, 1); // 设置块的大小
        }
        if (this.secChoose_Block != null) {
            this.secChoose_Block.scale = new Vec3(1, 1, 1); // 设置块的大小
        }
    }
    //#endregion

    //#region 检查
    /** 检查是否是相邻的块 */
    private isAdjacentBlock(block: Node): boolean {
        let trans1 = this.firChoose_Block.getComponent(Block).transform;
        let trans2 = block.getComponent(Block).transform;
        return Math.abs(trans1.x - trans2.x) + Math.abs(trans1.y - trans2.y) == 1;
    }

    /** 检查交换后是否能消除 */
    private checkIfCanEliminate(block1: Node, block2: Node): boolean {
        // console.log('=================检查交换后是否能消除===============');
        // 获取两个方块的类型
        let type1 = block1.getComponent(Block).type;
        let type2 = block2.getComponent(Block).type;

        if (type1 == type2) return false; // 如果两个方块类型相同，则不进行交换

        // 获取两个方块的位置
        let pos1 = block1.getComponent(Block).transform;
        let pos2 = block2.getComponent(Block).transform;

        // console.log("type1:", type1, "pos1:", pos1);
        // console.log("type2:", type2, "pos2:", pos2);

        // 检查block1是否能形成三消
        let canEliminate1 = this.checkAreaCanConsume(pos1, type1, this.blockData);
        // console.log("canEliminate1:", canEliminate1);
        // 检查block2是否能形成三消
        let canEliminate2 = this.checkAreaCanConsume(pos2, type2, this.blockData);
        // console.log("canEliminate2:", canEliminate2);

        if (canEliminate1) {
            // this.tryToRemoveBlock(block1);
            this.tryToRemoveBlockInLine(block1);
        }

        if (canEliminate2) {
            // this.tryToRemoveBlock(block2);
            this.tryToRemoveBlockInLine(block2);
        }

        return canEliminate1 || canEliminate2;
    }

    /** 检查指定范围的方块是否能消除 */
    private checkAreaCanConsume(position: Vec3, type: number, blockData: number[][]): boolean {
        const block = blockData;
        const rows = GameManager.instance.curBoard.x;
        const cols = GameManager.instance.curBoard.y;
        // console.log('============检查指定位置和类型的方块是否能形成三消=============');
        // console.log('方块数据:', block);
        // console.log('检查位置:', position);
        // console.log('检查类型:', type);
        // 四个方向: 水平、垂直、两个对角线
        const directions = [
            { x: 0, y: 1 },  // 垂直方向
            { x: 1, y: 0 },  // 水平方向
        ];

        for (const dir of directions) {
            let count = 1; // 包含当前位置本身
            // 向一个方向检查
            for (let i = 1; i < 4; i++) {
                const checkX = position.x + dir.x * i;
                const checkY = position.y + dir.y * i;

                // 不检查原先方向
                if (checkX == position.x && checkY == position.y) break;
                // 检查边界
                if (checkX < 0 || checkX >= rows || checkY < 0 || checkY >= cols) {
                    break;
                }

                // 检查方块类型是否相同
                if (block[checkX][checkY] == type) {
                    // console.log(`检查到符合条件的位置: (${checkX}, ${checkY})`);
                    count++;
                } else {
                    break;
                }
            }

            // 向相反方向检查
            for (let i = 1; i < 4; i++) {
                const checkX = position.x - dir.x * i;
                const checkY = position.y - dir.y * i;

                // 不检查原先方向
                if (checkX == position.x && checkY == position.y) break;
                // 检查边界
                if (checkX < 0 || checkX >= rows || checkY < 0 || checkY >= cols) {
                    break;
                }

                // 检查方块类型是否相同
                if (block[checkX][checkY] == type) {
                    // console.log(`检查到符合条件的位置: (${checkX}, ${checkY})`);
                    count++;
                } else {
                    break;
                }
            }
            // 如果在该方向上有至少3个相同类型的方块(包括当前位置)，则满足条件
            if (count >= 3) {
                return true;
            }
        }
        return false;
    }

    //#endregion

    //#region 移动
    /** 尝试移动 */
    private tryToMove(block1: Node, block2: Node) {
        this.isMoving = true;
        if (block1 == null || block2 == null) {
            console.log('块为空');
            return;
        }
        if (block1 == block2) {
            console.log('不能移动自己');
            return;
        }
        if (this.isAdjacentBlock(block2)) {
            // 先执行视觉上的交换
            this.swapBlocks(block1, block2, () => {
                // 检查交换后是否能消除
                if (this.checkIfCanEliminate(block1, block2)) {
                    console.log('================交换成功');
                    console.log(this.blockData);
                    console.log(this.block);
                    this.scheduleOnce(() => {
                        this.moveBlockDown();
                    }, 0.1);
                    this.isMoving = false;
                } else {
                    this.scheduleOnce(() => {
                        // 交换失败，返回原位
                        console.log('==================交换失败');
                        this.swapBack(block1, block2);
                    }, 0.1);
                }
            });
        }
        else {
            console.log('！！！！！！！！！！不能移动到相邻的块！！！！！！！！！！');
            this.isMoving = false;
            return;
        }
    }
    /** 视觉上交换两个方块的位置 */
    private swapBlocks(block1: Node, block2: Node, callback: Function) {
        let trans1 = block1.getComponent(Block).transform; // 获取块的位置
        let trans2 = block2.getComponent(Block).transform;
        let pos1 = this.boardData[trans1.x][trans1.y].worldPosition.clone(); // 获取块的位置
        let pos2 = this.boardData[trans2.x][trans2.y].worldPosition.clone();

        this.commitSwap(block1, block2);

        Tween.stopAllByTarget(block1);
        Tween.stopAllByTarget(block2);
        tween(block1)
            .to(0.2, { worldPosition: pos2 })
            .start();
        tween(block2)
            .to(0.2, { worldPosition: pos1 })
            .call(() => {
                if (callback) callback();
            })
            .start();
    }
    /** 交换回原位置 */
    private swapBack(block1: Node, block2: Node) {
        console.log('==================交换失败，返回原位==================');
        let trans1 = block1.getComponent(Block).transform; // 获取块的位置
        let trans2 = block2.getComponent(Block).transform;
        let pos1 = this.boardData[trans1.x][trans1.y].worldPosition.clone(); // 获取块的位置
        let pos2 = this.boardData[trans2.x][trans2.y].worldPosition.clone();
        Tween.stopAllByTarget(block1);
        Tween.stopAllByTarget(block2);
        tween(block1)
            .to(0.2, { worldPosition: pos2 })
            .start();

        tween(block2)
            .to(0.2, { worldPosition: pos1 })
            .call(() => {
                this.commitSwap(block1, block2);
                this.isMoving = false;
            })
            .start();
    }
    /** 确认交换，更新transform信息 */
    private commitSwap(block1: Node, block2: Node) {
        let transform1 = block1.getComponent(Block).transform;
        let transform2 = block2.getComponent(Block).transform;
        let type1 = block1.getComponent(Block).type;
        let type2 = block2.getComponent(Block).type;

        // 更新transform信息
        block1.getComponent(Block).transform = transform2;
        block2.getComponent(Block).transform = transform1;

        // TODO:这里可以添加消除检测等后续逻辑
        this.blockData[transform1.x][transform1.y] = type2;
        this.blockData[transform2.x][transform2.y] = type1;
        console.log('更新数据');
        console.log(this.blockData);
    }

    /** 尝试移除块 */
    private tryToRemoveBlockInArea(block: Node, callback?: Function) {
        let trans = block.getComponent(Block).transform; // 获取块的位置
        let type = block.getComponent(Block).type;
        console.log(`尝试移除块: (${trans.x}, ${trans.y}) , 类型: ${type}`);
        console.log(this.blockData);

        const rows = GameManager.instance.curBoard.x;
        const cols = GameManager.instance.curBoard.y;

        // 收集需要消除的方块位置（使用广度优先搜索查找所有相邻的同类方块）
        let toRemovePositions: Vec2[] = [];
        let visited: boolean[][] = [];

        // 初始化访问标记数组
        for (let i = 0; i < rows; i++) {
            visited[i] = [];
            for (let j = 0; j < cols; j++) {
                visited[i][j] = false;
            }
        }

        // 使用队列进行广度优先搜索
        let queue: Vec2[] = [new Vec2(trans.x, trans.y)];
        visited[trans.x][trans.y] = true;
        toRemovePositions.push(new Vec2(trans.x, trans.y));

        // 定义四个方向：上、下、左、右
        const directions = [
            { x: -1, y: 0 },  // 上
            { x: 1, y: 0 },   // 下
            { x: 0, y: -1 },  // 左
            { x: 0, y: 1 }    // 右
        ];

        // 广度优先搜索查找所有相邻的同类方块
        while (queue.length > 0) {
            const currentPos = queue.shift()!;

            // 检查四个方向
            for (const dir of directions) {
                const newX = currentPos.x + dir.x;
                const newY = currentPos.y + dir.y;

                // 检查边界
                if (newX >= 0 && newX < rows && newY >= 0 && newY < cols) {
                    // 检查是否未访问过且类型相同
                    if (!visited[newX][newY] && this.blockData[newX][newY] === type) {
                        visited[newX][newY] = true;
                        const newPos = new Vec2(newX, newY);
                        toRemovePositions.push(newPos);
                        queue.push(newPos);
                    }
                }
            }
        }

        // 只有当相邻的同类方块数量大于等于3时才进行消除
        if (toRemovePositions.length >= 3) {
            console.log(`找到 ${toRemovePositions.length} 个相邻的同类方块，准备消除`);

            // 移除所有收集到的方块
            for (const pos of toRemovePositions) {
                this.findBlocks(pos.x, pos.y);
            }

            // 播放消除音效
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_SUCCESS);
        } else {
            console.log(`只有 ${toRemovePositions.length} 个相邻的同类方块，不足3个，不进行消除`);
        }

        if (callback) {
            callback();
        }
    }

    /** 尝试移除块 */
    private tryToRemoveBlockInLine(block: Node, callback?: Function) {
        let trans = block.getComponent(Block).transform; // 获取块的位置
        let type = block.getComponent(Block).type;
        // console.log(`尝试移除块: (${trans.x}, ${trans.y}) , 类型: ${type}`);
        // console.log(this.blockData);

        // 收集需要消除的方块位置（同一行或同一列中连续3个及以上相同类型的方块）
        let toRemovePositions: Vec2[] = [];

        // 检查水平方向
        let horizontalPositions: Vec2[] = [];
        // 向左检查
        for (let y = trans.y; y >= 0; y--) {
            if (this.blockData[trans.x][y] == type) {
                horizontalPositions.push(new Vec2(trans.x, y));
            } else {
                break;
            }
        }
        // 向右检查
        for (let y = trans.y + 1; y < GameManager.instance.curBoard.y; y++) {
            if (this.blockData[trans.x][y] == type) {
                horizontalPositions.push(new Vec2(trans.x, y));
            } else {
                break;
            }
        }

        // 如果水平方向有3个或以上相同类型方块，则加入消除列表
        if (horizontalPositions.length >= 3) {
            toRemovePositions.push(...horizontalPositions);
        }

        // 检查垂直方向
        let verticalPositions: Vec2[] = [];
        // 向上检查
        for (let x = trans.x; x >= 0; x--) {
            if (this.blockData[x][trans.y] == type) {
                verticalPositions.push(new Vec2(x, trans.y));
            } else {
                break;
            }
        }
        // 向下检查
        for (let x = trans.x + 1; x < GameManager.instance.curBoard.x; x++) {
            if (this.blockData[x][trans.y] == type) {
                verticalPositions.push(new Vec2(x, trans.y));
            } else {
                break;
            }
        }

        // 如果垂直方向有3个或以上相同类型方块，则加入消除列表
        if (verticalPositions.length >= 3) {
            toRemovePositions.push(...verticalPositions);
        }

        // 去重处理
        const uniquePositions: Vec2[] = [];
        const positionSet: Set<string> = new Set();
        for (const pos of toRemovePositions) {
            const key = `${pos.x},${pos.y}`;
            if (!positionSet.has(key)) {
                positionSet.add(key);
                uniquePositions.push(pos);
            }
        }

        // 移除所有收集到的方块
        for (const pos of uniquePositions) {
            this.findBlocks(pos.x, pos.y);
        }

        if (callback) {
            callback();
        }
    }
    /** 寻找其他方块并消除 */
    private findBlocks(x: number, y: number) {
        // 合并查找和删除逻辑
        for (let i = this.block.length - 1; i >= 0; i--) {
            const blockNode = this.block[i];
            const blockComp = blockNode.getComponent(Block);

            if (blockComp && blockComp.transform.x === x && blockComp.transform.y === y) {
                // console.log('删除方块' + blockNode.name + '坐标：' + blockComp.transform);
                let trans = blockComp.transform;

                // 更新blockData数据
                this.blockData[trans.x][trans.y] = 0;

                // 从block数组中移除对应的方块
                this.block.splice(i, 1);

                // 添加消除动画效果
                Tween.stopAllByTarget(blockNode);
                tween(blockNode)
                    .to(0.25, { scale: new Vec3(0, 0, 0) }) // 缩小效果
                    .call(() => {
                        // 从父节点中移除并销毁
                        blockNode.removeFromParent();
                        blockNode.destroy();
                    })
                    .start();
            }
        }
    }

    //#endregion

    //#region 操作结束逻辑
    /** 移动方块下落*/
    private moveBlockDown() {
        console.log('--------------------------------方块下落');
        let array: Node[] = [];
        const row = GameManager.instance.curBoard.x;
        const col = GameManager.instance.curBoard.y;
        let distance = this.boardData[0][0].worldPosition.clone().y - this.boardData[1][0].worldPosition.clone().y;

        // 从下往上处理每一列
        for (let j = col - 1; j >= 0; j--) {
            for (let i = row - 1; i >= 0; i--) {
                // 如果当前位置为空
                if (this.blockData[i][j] == 0) {
                    // 向上查找第一个非空方块
                    // console.log(`当前位置 ${i} ${j} 为空`);
                    for (let k = i - 1; k >= 0; k--) {
                        if (this.blockData[k][j] != 0) {
                            let block = this.getBlockAtTrans(k, j);
                            block.getComponent(Block).transform = new Vec3(i, j, 0);
                            // console.log(block.name + '坐标：' + block.getComponent(Block).transform);
                            array.push(block); // 将上面的方块移到当前位置
                            // 将上面的方块移到当前位置
                            this.blockData[i][j] = this.blockData[k][j];
                            this.blockData[k][j] = 0; // 上面的位置置空
                            break;
                        }
                    }
                }
            }
        }
        let temp = this.blockData;
        console.log(temp);
        this.updateBlockPos(array);

        for (let j = col - 1; j >= 0; j--) {
            let count = 0;
            for (let i = row - 1; i >= 0; i--) {
                // 如果当前位置为空
                if (this.blockData[i][j] == 0) {
                    // 向上查找第一个非空方块
                    console.log(`当前位置 ${i} ${j} 为空`);
                    this.spawnBlock(i, j, distance * (++count));
                }
            }
        }
    }

    /** 生成方块 */
    private spawnBlock(row: number, col: number, distance: number) {
        let index = Math.floor(Math.random() * 4) + 1; // 生成1到4之间的随机数
        console.log('生成方块' + index + '坐标：' + row + ',' + col);
        this.blockData[row][col] = index;
        ResourceManager.loadResource(RES_PATH.BLOCK + index, Prefab, (err, prefab) => {
            if (err) {
                console.error(err);
            }
            let block = instantiate(prefab);
            block.setParent(this.block[0].parent);
            block.getComponent(Block).transform = new Vec3(row, col, 0);
            this.block.push(block); // 将棋子添加到棋子数组中
            let tempPos = this.boardData[0][col].worldPosition.clone();
            let targetBlock = new Vec3(tempPos.x, tempPos.y + distance, 0);
            block.setWorldPosition(targetBlock); // 设置棋子的世界坐标

            let trans = block.getComponent(Block).transform; // 获取棋子的坐标
            let type = block.getComponent(Block).type;  // 获取棋子的类型
            Tween.stopAllByTarget(block);
            tween(block)
                .delay(moveDelay)
                .to(moveTime, { worldPosition: this.boardData[trans.x][trans.y].worldPosition.clone() })
                .call(() => {
                    console.log('检查方块落下后是否能继续消除或者有道具可以合成');
                    let isCanEliminate = this.checkAreaCanConsume(trans, type, this.blockData);
                    if (isCanEliminate) {   // 如果可以消除
                        this.tryToRemoveBlockInLine(block, () => {
                            this.scheduleOnce(() => {
                                this.moveBlockDown(); // 继续下落
                            }, moveDelay);
                        });
                    }
                })
                .start();
        });
    };

    /** 更新棋子位置 */
    private updateBlockPos(array: Node[]) {
        console.log('==================移动旧块位置');
        let temp = this.blockData;
        console.log(temp);
        for (let block of array) {
            let trans = block.getComponent(Block).transform;
            let type = block.getComponent(Block).type;
            Tween.stopAllByTarget(block);
            tween(block)
                .delay(moveDelay)
                .to(moveTime, { worldPosition: this.boardData[trans.x][trans.y].worldPosition.clone() })
                .call(() => {
                    console.log('检查方块落下后是否能继续消除或者有道具可以合成');

                    let isCanEliminate = this.checkAreaCanConsume(trans, type, this.blockData);
                    if (isCanEliminate) {   // 如果可以消除
                        this.tryToRemoveBlockInLine(block, () => {
                            this.scheduleOnce(() => {
                                this.moveBlockDown(); // 继续下落
                            }, moveDelay);
                        });
                    }
                })
                .start();
        }
    }

    /** 根据行列坐标获取对应位置的方块 */
    private getBlockAtTrans(row: number, col: number): Node | null {
        for (let i = 0; i < this.block.length; i++) {
            let block = this.block[i];
            let transform = block.getComponent(Block).transform;
            if (transform.x === row && transform.y === col) {
                return block;
            }
        }
        return null;
    }
    //#endregion

    /** 游戏结束 */
    private gameOver(isWin: boolean = false) {
        this.block = [];
        this.board = [];
        this.releaseTempVar(); // 释放临时变量
        this.cancelListening(); // 取消监听
        this.scheduleOnce(() => {
            EventManager.emit(Constant.EVENT_TYPE.GAME_OVER, isWin); // 发送游戏失败事件胜利事件
        }, 0.5);
    }

    /** 播放背景音乐 */
    private playBGM() {
        // 是否是第一次触摸
        if (this.isFirstTouch) {
            console.log('播放背景音乐');
            AudioManager.play(Constant.AUDIO_TYPE.BGM); // 播放背景音乐
            this.isFirstTouch = false;
        }
    }

    /** 显示引导 */
    private showGuide() {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, true);
        console.log('打开引导UI');
    }

    /** 隐藏引导 */
    private hideGuide() {
        EventManager.emit(Constant.EVENT_TYPE.CHANGE_GUIDE, false);     // 显示引导
    }

    /** 开始监听全局触摸事件 */
    public startListening() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    /** 取消监听全局触摸事件 */
    public cancelListening() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
}