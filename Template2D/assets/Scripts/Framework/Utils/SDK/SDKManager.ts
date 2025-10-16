import { _decorator, Component, Node } from 'cc';
import super_html_playable from './super_html_playable';


const { ccclass, property } = _decorator;

@ccclass('SDKManager')
export class SDKManager extends Component {
    private static _instance: SDKManager = null;
    public static get instance() {
        return this._instance;
    }

    onLoad() {
        if (!SDKManager.instance) {
            SDKManager._instance = this;
        } else {
            this.destroy();
        }

        super_html_playable.game_ready();
    }

    clickDown() {
        super_html_playable.download();
        super_html_playable.game_end();

    }
}


