import { _decorator, Component, Enum, Node, Vec3 } from 'cc';
import { BLOCK_TYPE } from './Framework/Constant';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {
    @property({ type: Enum(BLOCK_TYPE) })
    public type: number = 0;
    public transform: Vec3 = new Vec3(0, 0, 0);
}