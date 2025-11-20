import { _decorator, Component, Label, Node, Sprite, SpriteFrame } from 'cc';
import super_html_playable from '../SDK/super_html_playable';
const { ccclass, property } = _decorator;

@ccclass('LocationText')
export class LocationText extends Component {

    /** 英文文本 */
    @property({ type: String, tooltip: "英文" })
    ENText = "";

    @property
    ENSize = -1;

    /** 日文文本 */
    @property({ type: String, tooltip: "日文" })
    JPText = "";

    @property
    JPSize = -1;

    /** 韩文文本 */
    @property({ type: String, tooltip: "韩文" })
    KRText = "";

    @property
    KRSize = -1;

    /** 中文简体文本 */
    @property({ type: String, tooltip: "中文简体" })
    CNSText = "";

    @property
    CNSSize = -1;

    /** 中文繁体文本 */
    @property({ type: String, tooltip: "中文繁体" })
    CNTText = "";

    @property
    CNTSize = -1;

    /** 德文文本 */
    @property({ type: String, tooltip: "德文" })
    DEText = "";

    @property
    DESize = -1;

    /** 法文文本 */
    @property({ type: String, tooltip: "法文" })
    FRText = "";

    @property
    FRSize = -1;

    /** 西班牙文文本 */
    @property({ type: String, tooltip: "西班牙文" })
    ESText = "";

    @property
    ESSize = -1;

    /** 葡萄牙文文本 */
    @property({ type: String, tooltip: "葡萄牙文" })
    PTText = "";

    @property
    PTSize = -1;

    /** 俄文文本 */
    @property({ type: String, tooltip: "俄文" })
    RUText = "";

    @property
    RUSize = -1;

    /** 图片 */
    @property(Label)
    mLabel: Label;

    start() {
        this.mLabel = this.getComponent(Label);
        var language = super_html_playable.get_web_language();
        console.log("Language : " + language);
    }

    update(deltaTime: number) {
        var language = super_html_playable.get_web_language();

        if (language.indexOf("zh") == -1
            && language.indexOf("ko") == -1
            && language.indexOf("ja") == -1
            && language.indexOf("de") == -1
            && language.indexOf("fr") == -1
            && language.indexOf("es") == -1
            && language.indexOf("pt") == -1
            && language.indexOf("ru") == -1) {
            this.mLabel.string = this.ENText.replace(/\$/g, "\n");
            if (this.ENSize != -1) {
                this.mLabel.fontSize = this.ENSize;
            }
        }
        else if (language.indexOf("zh-CN") != -1) {
            this.mLabel.string = this.CNSText.replace(/\$/g, "\n");
            if (this.CNSSize != -1) {
                this.mLabel.fontSize = this.CNSSize;
            }
            console.log("中文简体" + this.CNSText + " 大小：" + this.CNSSize);
        }
        else if (language.indexOf("zh-TW") != -1 || language.indexOf("zh-HK") != -1) {
            this.mLabel.string = this.CNTText.replace(/\$/g, "\n");
            if (this.CNTSize != -1) {
                this.mLabel.fontSize = this.CNTSize;
            }
        }
        else if (language.indexOf("ko") != -1) {
            this.mLabel.string = this.KRText.replace(/\$/g, "\n");
            if (this.KRSize != -1) {
                this.mLabel.fontSize = this.KRSize;
            }
        }
        else if (language.indexOf("ja") != -1) {
            this.mLabel.string = this.JPText.replace(/\$/g, "\n");
            if (this.JPSize != -1) {
                this.mLabel.fontSize = this.JPSize;
            }
        }
        else if (language.indexOf("de") != -1) {
            this.mLabel.string = this.DEText.replace(/\$/g, "\n");
            if (this.DESize != -1) {
                this.mLabel.fontSize = this.DESize;
            }
        }
        else if (language.indexOf("fr") != -1) {
            this.mLabel.string = this.FRText.replace(/\$/g, "\n");
            if (this.FRSize != -1) {
                this.mLabel.fontSize = this.FRSize;
            }
        }
        else if (language.indexOf("es") != -1) {
            this.mLabel.string = this.ESText.replace(/\$/g, "\n");
            if (this.ESSize != -1) {
                this.mLabel.fontSize = this.ESSize;
            }
        }
        else if (language.indexOf("pt") != -1) {
            this.mLabel.string = this.PTText.replace(/\$/g, "\n");
            if (this.PTSize != -1) {
                this.mLabel.fontSize = this.PTSize;
            }
        }
        else if (language.indexOf("ru") != -1) {
            this.mLabel.string = this.RUText.replace(/\$/g, "\n");
            if (this.RUSize != -1) {
                this.mLabel.fontSize = this.RUSize;
            }
        }
    }
}


