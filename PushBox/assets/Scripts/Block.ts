import { _decorator, Component, Node, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property({ type: Boolean, tooltip: "方块类型是否是玩家，true为玩家方块，false为箱子方块" })
    public isPlayer: boolean = false;
    @property({ type: Vec2, tooltip: "方块的坐标" })
    public transform: Vec2 = new Vec2(0, 0);
}