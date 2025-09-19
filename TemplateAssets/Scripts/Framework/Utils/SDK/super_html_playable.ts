import { EDITOR } from "cc/env";

/**
 * super-html playable adapter
 * @help https://store.cocos.com/app/detail/3657
 * @home https://github.com/magician-f/cocos-playable-demo
 * @author https://github.com/magician-f
 */
export class super_html_playable {
    google_store_url: string =
        "";
    app_store_url: string =
        "";

    constructor() {
        if (!EDITOR) {
            this.setStoreUrl();
        }
    }

    setStoreUrl() {
        console.log(`super_html_playable setStoreUrl`);
        this.set_google_play_url(this.google_store_url);
        this.set_app_store_url(this.app_store_url);
        this.set_google_play_cpp_url(this.google_store_url);
        this.set_app_store_cpp_url(this.app_store_url);
    }

    download() {
        console.log("super_html_playable download");
        //@ts-ignore
        window["super_html"] && window["super_html"].download();
        this.game_end();
    }

    game_ready() {
        console.log("game ready");
        //@ts-ignore
        window.super_html && super_html.game_ready();
    }

    game_end() {
        console.log("game end");
        //@ts-ignore
        window.super_html && super_html.game_end();
    }

    /**
     * 是否隐藏下载按钮，意味着使用平台注入的下载按钮
     * channel : google
     */
    is_hide_download() {
        //@ts-ignore
        if (window.super_html && super_html.is_hide_download) {
            //@ts-ignore
            return super_html.is_hide_download();
        }
        return false;
    }

    /**
     * 设置商店地址
     * @param url https://play.google.com/store/apps/details?id=com.unity3d.auicreativetestapp
     */
    set_google_play_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.google_play_url = url);
    }

    /**
     * 设置商店地址
     * @param url https://apps.apple.com/us/app/ad-testing/id1463016906
     */
    set_app_store_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.appstore_url = url);
    }
    /**
     * 设置商店cpp地址
     * @param url https://play.google.com/store/apps/details?id=com.unity3d.auicreativetestapp
     */
    set_google_play_cpp_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.google_play_cpp_url = url);
    }

    /**
     * 设置商店cpp地址
     * @param url https://apps.apple.com/us/app/ad-testing/id1463016906
     */
    set_app_store_cpp_url(url: string) {
        //@ts-ignore
        window.super_html && (super_html.appstore_cpp_url = url);
    }
}
export default new super_html_playable();
