import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import super_html_playable from '../SDK/super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('LocationImage')
export class LocationImage extends Component {

    @property(SpriteFrame)
    enSprite: SpriteFrame;

    @property(SpriteFrame)
    jpSprite: SpriteFrame;

    @property(SpriteFrame)
    krSprite: SpriteFrame;

    @property(SpriteFrame)
    cnSprite: SpriteFrame;

    @property(SpriteFrame)
    twSprite: SpriteFrame;

    @property(Sprite)
    mSprite: Sprite;


    start() {
        this.mSprite = this.getComponent(Sprite);
    }

    update(deltaTime: number) {
        var language = super_html_playable.get_web_language();
        if (language.indexOf("zh") == -1 && language.indexOf("ko") == -1 && language.indexOf("ja") == -1) {
            this.mSprite.spriteFrame = this.enSprite;
        }
        else if (language.indexOf("zh-CN") != -1) {
            this.mSprite.spriteFrame = this.cnSprite;
        }
        else if (language.indexOf("zh-TW") != -1 || language.indexOf("zh-HK") != -1) {
            this.mSprite.spriteFrame = this.twSprite;
        }
        else if (language.indexOf("ko") != -1) {
            this.mSprite.spriteFrame = this.krSprite;
        }
        else if (language.indexOf("ja") != -1) {
            this.mSprite.spriteFrame = this.jpSprite;
        }
    }
}


