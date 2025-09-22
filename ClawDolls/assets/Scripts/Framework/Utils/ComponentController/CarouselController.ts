import { _decorator, Component, Node, Sprite, SpriteFrame, color, tween, Color, Animation } from 'cc';
import { EventManager } from '../../Common/Event/EventCenter';
import { Constant } from '../../Constant';
const { ccclass, property } = _decorator;

@ccclass('CarouselController')
export class CarouselController extends Component {
    @property(Node)
    private showImage: Node[] = [];
    private curShowIndex: number = 0;

    @property(Node)
    private needReplace: Node[] = [];//需要替换的节点

    @property(SpriteFrame)
    private needReplaceImage: SpriteFrame[] = [];//需要替换的图片
    @property(SpriteFrame)
    private replaceImage: SpriteFrame[] = [];//替换的图片

    private timer: number = 0;
    private waitTime: number = 1.5;

    start() {
        this.initImages();
        EventManager.on(Constant.EVENT_TYPE.CHANGE_SHOW_IMAGE, this.changeShowImage, this);
    }

    onDestroy() {
        EventManager.off(Constant.EVENT_TYPE.CHANGE_SHOW_IMAGE, this.changeShowImage, this);
    }

    update(deltaTime: number) {
        // this.timer += deltaTime;
        // if (this.timer >= this.waitTime) {
        //     this.timer = 0;
        //     this.changeShowImage();
        // }
    }

    // 初始化基础图片
    initImages() {
        this.node.children.forEach(child => {
            this.showImage.push(child);
        });
        console.log(this.showImage);
        for (let i = 0; i < this.showImage.length; i++) {
            this.showImage[i].active = false;
        }
        this.showImage[this.curShowIndex].active = true;
    }

    // 替换图片
    replaceImages() {
        for (let i = 0; i < this.needReplace.length; i++) {
            this.needReplace[i].getComponent(Sprite).spriteFrame = this.replaceImage[i];
        }
    }

    // 恢复图片
    recoverImages() {
        for (let i = 0; i < this.needReplace.length; i++) {
            this.needReplace[i].getComponent(Sprite).spriteFrame = this.needReplaceImage[i];
        }
    }

    // 切换显示图片
    private changeShowImage() {
        if (this.curShowIndex < this.showImage.length - 1) {
            this.showImage[this.curShowIndex + 1].active = true;
            this.showImage[this.curShowIndex + 1].getComponent(Animation).play("ShowA255");

            // this.showImage[this.curShowIndex].getComponent(Animation).play("ShowA0");

            this.scheduleOnce(() => {
                this.showImage[this.curShowIndex].active = false;
                this.curShowIndex++;
            }, 0.5);
            // this.showImage[this.curShowIndex].active = false;

        } else {
            this.showImage[0].active = true;
            this.showImage[this.curShowIndex].active = true;
            this.showImage[this.curShowIndex].getComponent(Animation).play("ShowA0");
            this.curShowIndex = 0;
        }

        if (this.curShowIndex == 0 || this.curShowIndex == 4) {
            this.recoverImages();
        } else {
            this.replaceImages();
        }
    }
}


