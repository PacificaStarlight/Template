import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import super_html_playable from '../SDK/super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('LocationImage')
export class LocationImage extends Component {

    @property(SpriteFrame)
    enSprite: SpriteFrame;
    @property()
    enSize: number = -1;

    @property(SpriteFrame)
    jpSprite: SpriteFrame;
    @property()
    jpSize: number = -1;

    @property(SpriteFrame)
    krSprite: SpriteFrame;
    @property()
    krSize: number = -1;

    @property(SpriteFrame)
    cnSprite: SpriteFrame;
    @property()
    cnSize: number = -1;

    @property(SpriteFrame)
    twSprite: SpriteFrame;
    @property()
    twSize: number = -1;

    @property(SpriteFrame)
    deSprite: SpriteFrame;
    @property()
    deSize: number = -1;

    @property(SpriteFrame)
    frSprite: SpriteFrame;
    @property()
    frSize: number = -1;

    @property(Sprite)
    mSprite: Sprite;


    start() {
        this.mSprite = this.getComponent(Sprite);
    }

    update(deltaTime: number) {
        var language = super_html_playable.get_web_language();
        if (language.indexOf("zh") == -1
            && language.indexOf("ko") == -1
            && language.indexOf("ja") == -1
            && language.indexOf("de") == -1
            && language.indexOf("fr") == -1
        ) {
            this.mSprite.spriteFrame = this.enSprite;
            if (this.enSize != -1) {
                this.mSprite.node.setScale(this.enSize, this.enSize);
            }
        }
        else if (language.indexOf("zh-CN") != -1) {
            this.mSprite.spriteFrame = this.cnSprite;
            if (this.cnSize != -1) {
                this.mSprite.node.setScale(this.cnSize, this.cnSize);
            }
        }
        else if (language.indexOf("zh-TW") != -1 || language.indexOf("zh-HK") != -1) {
            this.mSprite.spriteFrame = this.twSprite;
            if (this.twSize != -1) {
                this.mSprite.node.setScale(this.twSize, this.twSize);
            }
        }
        else if (language.indexOf("ko") != -1) {
            this.mSprite.spriteFrame = this.krSprite;
            if (this.krSize != -1) {
                this.mSprite.node.setScale(this.krSize, this.krSize);
            }
        }
        else if (language.indexOf("ja") != -1) {
            this.mSprite.spriteFrame = this.jpSprite;
            if (this.jpSize != -1) {
                this.mSprite.node.setScale(this.jpSize, this.jpSize);
            }
        }
        else if (language.indexOf("de") != -1) {
            this.mSprite.spriteFrame = this.deSprite;
            if (this.deSize != -1) {
                this.mSprite.node.setScale(this.deSize, this.deSize);
            }
        }
        else if (language.indexOf("fr") != -1) {
            this.mSprite.spriteFrame = this.frSprite;
            if (this.frSize != -1) {
                this.mSprite.node.setScale(this.frSize, this.frSize);
            }
        }
    }
}


