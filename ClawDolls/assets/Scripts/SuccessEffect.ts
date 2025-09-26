import { _decorator, Animation, Component, Node, sp, tween, Vec3 } from 'cc';
import { UIManager } from './Framework/UIManager';
import { Constant } from './Framework/Constant';
import { AudioManager } from './Framework/Common/Audio/AudioManager';
import { InputManager } from './Framework/InputManager';
const { ccclass, property } = _decorator;

@ccclass('SuccessEffect')
export class SuccessEffect extends Component {
    @property(Node)
    private boardTop: Node = null;

    @property(Node)
    public moveBallNode: Node = null;

    public static instance: SuccessEffect;
    onLoad() {
        SuccessEffect.instance = this;
    }

    onEnable() {
        let duration = 0.1;
        tween(this.boardTop)
            .delay(duration)
            .to(0.5, { angle: -30 })
            .to(0.5, { angle: 0 })
            .start();
        console.log(this.boardTop.parent.name);

        console.log(this.boardTop.parent.children);

        this.moveBallNode.setSiblingIndex(this.boardTop.parent.children.length - 1);
        this.moveBallNode.getComponent(Animation).play(); //播放动画
        this.scheduleOnce(() => {
            UIManager.instance.successNode.children[3].children[0].active = true;
            this.moveBallNode.active = false;
        }, duration + 1.4);

        this.scheduleOnce(() => {
            console.log("播放");
            UIManager.instance.successNode.children[3].children[0].getComponent(sp.Skeleton).clearTrack(0);
            UIManager.instance.successNode.children[3].children[0].getComponent(sp.Skeleton).addAnimation(0, 'tuowei', false);
            AudioManager.playOneShot(Constant.AUDIO_TYPE.POS_SFX_COIN); // 播放音效  
        }, duration + 1.5);
    }

    start() {

    }

    update(deltaTime: number) {

    }
}


