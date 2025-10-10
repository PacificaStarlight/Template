import { _decorator, Component, error, find, ImageAsset, instantiate, isValid, JsonAsset, Node, Prefab, resources, SpriteComponent, SpriteFrame, TextAsset, Texture2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    /**
     * 加载资源
     * @param url   资源路径
     * @param type  资源类型
     * @param cb    回调
     * @method loadRes
     */
    public static loadRes(url: string, type: any, cb: Function = () => { }) {
        resources.load(url, type, (err: any, res: any) => {
            if (err) {
                error(err.message || err);
                cb(err, res);
                return;
            }
            cb && cb(null, res);
        });
    }

    /**
     * 获取特效prefab
     * @param modulePath 路径
     * @returns
     */
    public static loadEffectRes(modulePath: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(`prefab/effect/${modulePath}`, Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    console.error('effect load failed', modulePath);
                    reject && reject();
                    return;
                }
                resolve && resolve(prefab);
            });
        });
    }

    /**
     * 获取模型数据
     * @param modulePath 模型路径
     * @returns
     */
    public static loadModelRes(modulePath: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(`prefab/model/${modulePath}`, Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    console.error("model load failed", modulePath);
                    reject && reject();
                    return;
                }
                resolve && resolve(prefab);
            });
        });
    }

    /**
     * 设置精灵贴图
     * @param path 资源路径
     * @param sprite 精灵
     * @param cb 回调函数
     */
    public static setSpriteFrame(path: string, sprite: SpriteComponent, cb: Function) {
        this.loadRes(path + '/spriteFrame', SpriteFrame, (err: any, spriteFrame: SpriteFrame) => {
            if (err) {
                console.error('set sprite frame failed! err:', path, err);
                cb(err);
                return;
            }
            if (sprite && isValid(sprite)) {
                sprite.spriteFrame = spriteFrame;
                cb(null);
            }
        });
    }

    /**
     * 获取贴图资源
     * @param path 贴图路径
     * @returns
     */
    public static loadSpriteFrameRes(path: string) {
        return new Promise((resolve, reject) => {
            this.loadRes(path, SpriteFrame, (err: any, img: ImageAsset) => {
                if (err) {
                    console.error('spriteFrame load failed!', path, err);
                    reject && reject();
                    return;
                }

                let texture = new Texture2D();
                texture.image = img;

                let sf = new SpriteFrame();
                sf.texture = texture;

                resolve && resolve(sf);
            });
        });
    }

    /**
     * 获取UI prefab
     * @param prefabPath prefab路径
     * @param cb 回调函数
     */
    public static getUIPrefabRes(prefabPath: string, cb?: Function) {
        this.loadRes("prefab/ui/" + prefabPath, Prefab, cb);
    }

    /**
     * 创建ui界面
     * @param path ui路径
     * @param cb 回调函数
     * @param parent 父节点
     */
    public static createUI(path: string, cb?: Function, parent?: Node) {
        this.getUIPrefabRes(path, function (err: {}, prefab: Prefab) {
            if (err) return;
            let node: Node = instantiate(prefab);
            node.setPosition(0, 0, 0);
            if (!parent) {
                parent = find("Canvas") as Node;
            }

            parent.addChild(node);
            cb && cb(null, node);
        });
    }

    /**
     * 获取json数据
     * @param fileName 文件名
     * @param cb 回调函数
     */
    public static getJsonData(fileName: string, cb: Function) {
        this.loadRes("datas/" + fileName, null, function (err: any, content: JsonAsset) {
            if (err) {
                error(err.message || err);
                return;
            }

            if (content.json) {
                cb(err, content.json);
            } else {
                cb('failed!!!');
            }
        });
    }

    /**
     * 获取文本数据
     * @param fileName 文件名
     * @param cb  回调函数
     */
    public static getTextData(fileName: string, cb: Function) {
        this.loadRes("datas/" + fileName, null, function (err: any, content: TextAsset) {
            if (err) {
                error(err.message || err);
                return;
            }

            let text: string = content.text;
            cb(err, text);
        });
    }
}