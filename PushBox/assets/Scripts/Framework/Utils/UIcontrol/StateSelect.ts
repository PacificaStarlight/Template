/**
 * 这个类主要目的是为了存以下结构数据：状态对应的属性
 * 
 *      _ctrlData数据存储结构
 * 
 *      ctrlId:{
 *          //$$lastState$$ : state1
 *          $$default$$:{
 *              $$changedProp$$:[]
 *              $$lastProp$$:EnumPropName.active
 *              EnumPropName.active : true,//active
 *              1 : v3,//postion, 
 *              .....
 *          }
 *          stateUUId0 : {
 *              $$changedProp$$:[]
 *              $$lastProp$$:EnumPropName.active
 *              EnumPropName.active : true,//active
 *              .....
 *          },
 *          stateUUId1:{
 *              $$lastProp$$:EnumPropName.pos
 *              1 : v3,//postion,
 *              .....
 *          }
 *          stateName1:{},
 *      }
 * 
 */

import { CCClass, CCString, Color, Component, Enum, Font, Label, LabelOutline, Node, Quat, Size, Sprite, SpriteFrame, TransformBit, UIOpacity, UITransform, Vec2, Vec3, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
import { StateController } from './StateController';
import { EnumCtrlName, EnumStateName, EnumPropName } from './StateEnum';

const { ccclass, property, executeInEditMode, disallowMultiple } = _decorator;
Enum(EnumCtrlName);
Enum(EnumStateName);
Enum(EnumPropName);

/** 属性类型 */
type TPropValue = number | boolean | string | Vec3 | Vec2 | Color | Size | Quat | SpriteFrame | Font;
type TProp = {
    /** 上一次选择的属性 */
    $$lastProp$$?: number;
    /** 已经改变的属性 */
    $$changedProp$$?: { [name: string]: EnumPropName };
    [key: number]: TPropValue,
}
type TPage = {
    /** 上次选择的状态 */
    // $$lastState$$?: number,
    /** 默认状态属性 */
    $$default$$?: TProp;
    [state: number]: TProp
}
type TCtrl = {
    [stateId: string]: TPage;
}
@ccclass('StateSelect')
@executeInEditMode(true)
@disallowMultiple(true)
export class StateSelect extends Component {
    /** root节点所有的ctrl */
    @property
    private _ctrlsMap: { [ctrlId: string]: StateController } = {};
    /** 当前选中的ctrl名称对应的ctrlId */
    @property(EnumCtrlName)
    private _currCtrlId: number = null;
    // /** 当前选中的状态 */
    // @property(EnumStateName)
    // private _currState: number = null;
    @property
    private _root: Node = null;
    /** 当前状态要改变的属性 */
    @property({ type: EnumPropName })
    private _propKey: EnumPropName = null;
    /** 当前状态要改变的属性值 */
    @property
    private _propValue: any = null;
    @property
    private _isDeleteCurr: boolean = false;

    /** 状态数据 */
    @property
    private _ctrlData: TCtrl = {};

    /** 是否重新获取 */
    @property({ tooltip: "是否重新获取ctrl" })
    get isReload() {
        return false;
    }
    private set isReload(value: boolean) {
        let itself = this;
        if (EDITOR && value) {
            itself.__preload();
        }
    }
    @property({ type: EnumStateName, tooltip: "控制器当前状态" })
    get ctrlState() {
        let itself = this;
        return itself.getCurrCtrl()?.selectedIndex;
    }
    private set ctrlState(value: number) {
        let itself = this;
        if (itself.getCurrCtrl()) {
            itself.getCurrCtrl().selectedIndex = value;
        } else {
            itself.propKey = EnumPropName.Non;
        }
    }

    /** 控制器所在节点 */
    @property({ type: Node, tooltip: "控制器所在节点，仅提示用" })
    get root() {
        return this._root;
    }
    /** 控制器名称 */
    @property({ type: EnumCtrlName, displayName: "ctrlName", tooltip: "选择的控制器" })
    get currCtrlId() {
        return this._currCtrlId;
    }
    private set currCtrlId(value: number) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        itself._currCtrlId = value;
        if (!value) {
            return;
        }
        itself.updateCtrlPage(itself.getCurrCtrl());
    }
    /** 属性列表 */
    @property({ type: EnumPropName, tooltip: "属性选择列表" })
    get propKey() {
        return this._propKey;
    }
    private set propKey(value: EnumPropName) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        if (itself.getCurrCtrl() == void 0) {
            itself._propKey = EnumPropName.Non;
            return;
        }
        itself._propKey = value;
        let propData = itself.getPropData();
        propData.$$lastProp$$ = value;
        let propValue = itself.setPropValue(value)
        propData[value] = propValue;
        if (propValue != void 0 && value != EnumPropName.Non) {
            propData.$$changedProp$$ = propData.$$changedProp$$ || {};
            propData.$$changedProp$$[EnumPropName[value]] = value;
        }
        itself.updateChangedProp();
    }
    /** 属性值 */
    @property({ tooltip: "当前状态属性值" })
    get propValue() {
        return this._propValue;
    }
    private set propValue(value: any) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        itself._propValue = value;
        let propData = itself.getPropData();
        propData[itself.propKey] = value
        itself.updateState(itself.getCurrCtrl());
    }
    /** 是否删除当前属性 */
    @property({ tooltip: "是否删除当前属性" })
    get isDeleteCurr() {
        return this._isDeleteCurr;
    }
    private set isDeleteCurr(value: boolean) {
        let itself = this;
        if (!EDITOR || !value) {
            return;
        }
        if (!itself.currCtrlId) {
            return;
        }
        if (itself.propKey == EnumPropName.Non) {
            return;
        }
        //删除属性
        let pageData = itself.getPageData();
        let propData = itself.getPropData();
        let propKey = itself.propKey;
        delete propData[propKey];

        let $$changedProp$$ = propData.$$changedProp$$ || {};
        let name = EnumPropName[propKey];
        delete $$changedProp$$[name];
        let isHas = itself.isOtherHans(itself.getCurrCtrl(), propKey);
        if (!isHas) {
            delete pageData.$$default$$[propKey]
        }
        itself.propKey = EnumPropName.Non;
    }

    /** 已经改变的属性 */
    @property({ type: CCString, readonly: true, tooltip: "已经改变的属性" })
    changedProp: string[] = [];

    /** 刷新上次选中属性 */
    private refProp() {
        let itself = this;
        let propData = itself.getPropData();
        let lastProp = propData.$$lastProp$$;
        if (lastProp) {
            itself.propKey = lastProp;
        } else {
            itself.propKey = EnumPropName.Non;
        }
    }

    _isPreload = false;
    protected __preload() {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        if (itself._isPreload) {
            return;
        }
        itself._isPreload = true;
        itself.updateCtrlName(itself.node.parent);
        itself.updateCtrlPage(itself.getCurrCtrl());
        if (!itself.currCtrlId) {
            let ctrlIdKeys = Object.keys(itself._ctrlsMap);
            if (ctrlIdKeys.length) {
                itself.currCtrlId = Number(ctrlIdKeys[0]);
                itself.refProp();
            } else {
                console.error("没有添加控制器")
                itself._onPreDestroy();
            }
        } else {
            itself.refProp();
        }
    }
    protected onLoad() {
        let itself = this;
        if (!EDITOR) {
            return;
        }
        itself.node.on(Node.EventType.PARENT_CHANGED, itself._parentChanged, itself);
        itself.node.on(Node.EventType.ACTIVE_IN_HIERARCHY_CHANGED, itself._activeChanged, itself);
        itself.node.on(Node.EventType.TRANSFORM_CHANGED, itself._positionChanged, itself);
        itself.node.on(Node.EventType.SIZE_CHANGED, itself._sizeChanged, itself);
        itself.node.on(Node.EventType.ANCHOR_CHANGED, itself._anchorChanged, itself);
        itself.node.on(Node.EventType.COLOR_CHANGED, itself._colorChanged, itself);
        itself.node.on(Sprite.EventType.SPRITE_FRAME_CHANGED, itself._spriteChanged, itself)
    }
    //==============一些监听、设置默认属性=================
    /** 父节点改变 */
    private _parentChanged(oldParent: Node) {
        let itself = this;
        itself.transPosition(oldParent);
    }
    /** 节点active改变 */
    private _activeChanged(node: Node) {
        let itself = this;
        itself.setDefaultPorp(EnumPropName.Active);
    }
    /** 节点改变位置、旋转或缩放事件。如果具体需要判断是哪一个事件，可通过判断回调的第一个参数类型是 [[Node.TransformBit]] 中的哪一个来获取 */
    private _positionChanged(type: TransformBit) {
        let itself = this;
        if (type == Node.TransformBit.POSITION) {
            itself.setDefaultPorp(EnumPropName.Position);
        } else if (type == Node.TransformBit.ROTATION) {
            // itself.setDefaultPorp(EnumPropName.Rotation);
            itself.setDefaultPorp(EnumPropName.Euler);
        } else if (type == Node.TransformBit.SCALE) {
            itself.setDefaultPorp(EnumPropName.Scale);
        }
    }
    /** 节点大小改变 */
    private _sizeChanged(size: Size) {
        let itself = this;
        itself.setDefaultPorp(EnumPropName.Size);
    }
    /** 锚点改变 */
    private _anchorChanged(anchor: Vec2) {
        let itself = this;
        itself.setDefaultPorp(EnumPropName.Anchor);
    }
    /** 颜色改变 */
    private _colorChanged(color: Color) {
        let itself = this;
        itself.setDefaultPorp(EnumPropName.Color);
    }
    /** 图片改变 */
    private _spriteChanged(sprite: Sprite) {
        let itself = this;
        itself.setDefaultPorp(EnumPropName.SpriteFrame);
    }

    //=============一些界面的显示==============
    /** 更新控制器 */
    updateCtrlName(node: Node) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        let ctrls = itself.getCtrls(node);
        let arr = ctrls.map((val, i) => {
            if (itself._ctrlsMap[val._ctrlId] == void 0) {
                itself._ctrlsMap[val._ctrlId] = val;
            }
            return { name: val.ctrlName, value: val._ctrlId }
        })
        CCClass.Attr.setClassAttr(itself, "currCtrlId", "enumList", arr);
    }
    /** 获取所有的Ctrl */
    private getCtrls(node: Node): StateController[] {
        if (!node || !EDITOR) {
            return [];
        }
        let ctrls = node.getComponents(StateController);
        if (ctrls.length) {
            this._root = node;
            return ctrls;
        }
        return this.getCtrls(node.parent);
    }
    /** 更新状态数量 */
    updateCtrlPage(ctrl: StateController, deleteIndex?: number) {
        let itself = this;
        if (!ctrl || ctrl._ctrlId != itself.currCtrlId) {
            return;
        }
        if (deleteIndex != void 0 && deleteIndex != -1) {
            //被删的index，更新数据,一次只能删一个
            let pageData = itself.getPageData();
            for (let state = deleteIndex; state <= ctrl.states.length - 1; state++) {
                let next = pageData[state + 1];
                if (next) {
                    pageData[state] = next;
                }
            }
            let deleteProp = pageData[ctrl.states.length];
            delete pageData[ctrl.states.length]
            setTimeout(() => {
                for (let prop in deleteProp) {//这里要删除改变的属性
                    let isHas = itself.isOtherHans(ctrl, prop);
                    if (!isHas) {
                        delete pageData.$$default$$[prop];
                        itself.updateChangedProp();
                    }
                }
            })
        }
        let arr = ctrl.states.map((val, i) => {
            return { name: val.name, value: i }
        })
        CCClass.Attr.setClassAttr(itself, "ctrlState", "enumList", arr);
    }
    /** 控制器被删除 */
    updateDelete(ctrl: StateController) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        delete itself._ctrlData[ctrl._ctrlId];
        if (itself.currCtrlId == ctrl._ctrlId) {
            itself._onPreDestroy();
        } else {
            setTimeout(() => {
                itself.updateCtrlName(ctrl.node)
            });
        }
    }
    /** 已经改变的属性 */
    updateChangedProp() {
        let itself = this;
        let propdata = itself.getPropData();
        let arr = [];
        for (let name in propdata.$$changedProp$$) {
            arr.push(name);
        }
        itself.changedProp = arr;
    }
    updatePreLoad(ctrl: StateController) {
        let itself = this;
        if (!ctrl || ctrl._ctrlId != itself.currCtrlId) {
            return;
        }
        itself.__preload();
    }
    updateProp(ctrl: StateController) {
        let itself = this;
        if (!ctrl || ctrl._ctrlId != itself.currCtrlId) {
            return;
        }
        itself.refProp();
    }

    //==============更具控制器更新的状态 主要代码================
    private _isFromCtrl: boolean = false;
    /** 更新状态 */
    updateState(ctrl: StateController) {
        let itself = this;
        if (!ctrl) {
            return;
        }
        itself._isFromCtrl = true;
        let propData = itself.getPropData(ctrl.selectedIndex, ctrl._ctrlId);
        let defaultData = itself.getDefaultData(ctrl._ctrlId);
        for (let key in defaultData) {
            let value = propData[key] == void 0 ? defaultData[key] : propData[key];
            itself.updateUI(Number(key), value)
        }
        itself._isFromCtrl = false;
    }
    updateUI(type: EnumPropName, value: TPropValue) {
        let itself = this;
        switch (type) {
            case EnumPropName.Non: {
                return;
            }
            case EnumPropName.Active: {
                itself.node.active = value as boolean;
            } break;
            case EnumPropName.Position: {
                itself.node.position = value as Vec3;
            } break;
            case EnumPropName.Label: {
                let label = itself.node.getComponent(Label);
                if (label) {
                    label.string = value as string;
                }
            } break;
            case EnumPropName.Font: {
                let label = itself.node.getComponent(Label);
                if (label) {
                    label.font = value as Font;
                }
            } break;
            case EnumPropName.LabelOutline: {
                let labelOutline = itself.node.getComponent(LabelOutline);
                if (labelOutline) {
                    labelOutline.color = value as Color;
                }
            } break;
            case EnumPropName.SpriteFrame: {
                let sprite = itself.node.getComponent(Sprite);
                if (sprite) {
                    sprite.spriteFrame = value as SpriteFrame;
                }
            } break;
            // case EnumPropName.Rotation: {
            //     itself.node.rotation = value as Quat;
            // } break;
            case EnumPropName.Euler: {
                itself.node.eulerAngles = value as Vec3;
            } break;
            case EnumPropName.Scale: {
                itself.node.scale = value as Vec3;
            } break;
            case EnumPropName.Anchor: {
                let trans = itself.node.getComponent(UITransform);
                if (trans) {
                    trans.anchorPoint = value as Vec2;
                }
            } break;
            case EnumPropName.Size: {
                let trans = itself.node.getComponent(UITransform);
                if (trans) {
                    trans.contentSize = value as Size;
                }
            } break;
            case EnumPropName.Color: {
                let sprite_label = itself.node.getComponent(Sprite) || itself.node.getComponent(Label);
                if (sprite_label) {
                    sprite_label.color = value as Color;
                }
            } break;
            case EnumPropName.Opacity: {
                let opacity = itself.node.getComponent(UIOpacity);
                if (opacity) {
                    opacity.opacity = value as number;
                }
            } break;
            case EnumPropName.GrayScale: {
                let sprite = itself.node.getComponent(Sprite);
                if (sprite) {
                    sprite.grayscale = value as boolean;
                }
            } break;
        }
    }
    //=============一些计算方式，仅储存值使用=================
    private getCurrCtrl() {
        let itself = this;
        return itself._ctrlsMap[itself.currCtrlId]
    }
    /**
     * 其他状态是否有存在这个属性
     * @param ctrl 
     * @param prop 
     */
    private isOtherHans(ctrl: StateController, prop: number | string) {
        let itself = this;
        let isHas = false;
        let pageData = itself.getPageData();
        for (let index = 0, len = ctrl.states.length; index < len; index++) {
            let propData = pageData[index] || {};
            if (propData[prop] != void 0) {
                isHas = true;
                break;
            }
        }
        return isHas;
    }
    /** 获取某个控制器的状态数据 */
    private getPageData(ctrlId?: number) {
        let itself = this;
        ctrlId = ctrlId == void 0 ? itself.currCtrlId : ctrlId;
        if (itself._ctrlData[ctrlId] == void 0) {
            itself._ctrlData[ctrlId] = {};
        }
        return itself._ctrlData[ctrlId];
    }
    /** 获取某个状态的属性数据 */
    private getPropData(state?: number, ctrlId?: number) {
        let itself = this;
        let pageData = itself.getPageData(ctrlId);
        state = state == void 0 ? itself.ctrlState : state;
        if (pageData[state] == void 0) {
            pageData[state] = {};
        }
        return pageData[state];
    }
    /** 获取缓存的属性值 */
    private getPropValue(type: EnumPropName) {
        let itself = this;
        let propData = itself.getPropData();
        let value = propData[type];
        return value;
    }
    /** 获取默认属性 */
    private getDefaultData(ctrlId?: number) {
        let itself = this;
        let pageData = itself.getPageData(ctrlId);
        if (pageData.$$default$$ == void 0) {
            pageData.$$default$$ = {};
        }
        return pageData.$$default$$;
    }

    /** 还原编辑器属性值 */
    private setPropValue(type: EnumPropName) {
        let itself = this;
        let value = itself.handleValue(type);
        if (value == void 0) {
            CCClass.Attr.setClassAttr(itself, "propValue", "visible", false);
            return void 0;
        }
        CCClass.Attr.setClassAttr(itself, "propValue", "visible", true);
        itself._propValue = value;
        return value;
    }
    //解析并返回属性值
    private handleValue(type: EnumPropName) {
        let itself = this;
        let value: TPropValue;
        switch (type) {
            case EnumPropName.Non: {
                value = void 0;
            } break;
            case EnumPropName.Active: {
                value = itself.getActive();
            } break;
            case EnumPropName.Position: {
                value = itself.getPosition();
            } break;
            // case EnumPropName.Rotation: {
            //     value = itself.getRotation();
            // } break;
            case EnumPropName.Euler: {
                value = itself.getEuler();
            } break;
            case EnumPropName.Scale: {
                value = itself.getScale();
            } break;
            case EnumPropName.Anchor: {
                value = itself.getAnchor();
            } break;
            case EnumPropName.Size: {
                value = itself.getSize();
            } break;
            case EnumPropName.Color: {
                value = itself.getColor();
            } break;
            case EnumPropName.Opacity: {
                value = itself.getOpacity();
            } break;
            case EnumPropName.GrayScale: {
                value = itself.getGrayScale();
            } break;
            case EnumPropName.Label: {
                value = itself.getLabel();
            } break;
            case EnumPropName.Font: {
                value = itself.getFont();
            } break;
            case EnumPropName.LabelOutline: {
                value = itself.getLabelOutline();
            } break;
            case EnumPropName.SpriteFrame: {
                value = itself.getSpriteFrame();
            } break;
        }
        return value;
    }
    /** 编辑器改变、改变对于状态属性（最开始是说改变默认属性） */
    private setDefaultPorp(type: EnumPropName) {
        let itself = this;
        if (!EDITOR) {
            return;
        }
        if (itself._isFromCtrl) {
            return;//不是编辑器改变
        }
        // let defaultData = itself.getDefaultData();
        let getPropData = itself.getPropData();
        if (getPropData[type] == void 0) {
            return;//没有改变这个属性   
        }
        switch (type) {
            case EnumPropName.Non: {
                return;
            }
            case EnumPropName.Active: {
                getPropData[EnumPropName.Active] = itself.node.active;
            } break;
            case EnumPropName.Position: {
                Vec3.copy(getPropData[EnumPropName.Position] as Vec3, itself.node.position);
            } break;
            case EnumPropName.Label: {
                let label = itself.node.getComponent(Label);
                if (!label) {
                    return;
                }
                getPropData[EnumPropName.Label] = label.string;
            } break;
            case EnumPropName.Font: {
                let label = itself.node.getComponent(Label);
                if (!label) {
                    return;
                }
                getPropData[EnumPropName.Font] = label.font;
            } break;
            case EnumPropName.LabelOutline: {
                let labelOutline = itself.node.getComponent(LabelOutline);
                if (!labelOutline) {
                    return;
                }
                (getPropData[EnumPropName.LabelOutline] as Color).set(labelOutline.color);
            } break;
            case EnumPropName.SpriteFrame: {
                let sprite = itself.node.getComponent(Sprite);
                if (!sprite) {
                    return;
                }
                getPropData[EnumPropName.SpriteFrame] = sprite.spriteFrame;
            } break;
            // case EnumPropName.Rotation: {
            //     Vec3.copy(defaultData[EnumPropName.Rotation] as Quat, itself.node.rotation);
            // } break;
            case EnumPropName.Euler: {
                Vec3.copy(getPropData[EnumPropName.Euler] as Vec3, itself.node.eulerAngles);
            } break;
            case EnumPropName.Scale: {
                Vec3.copy(getPropData[EnumPropName.Scale] as Vec3, itself.node.scale);
            } break;
            case EnumPropName.Anchor: {
                let trans = itself.node.getComponent(UITransform);
                if (!trans) {
                    return;
                }
                Vec2.copy(getPropData[EnumPropName.Anchor] as Vec2, trans.anchorPoint);
            } break;
            case EnumPropName.Size: {
                let trans = itself.node.getComponent(UITransform);
                if (!trans) {
                    return;
                }
                (getPropData[EnumPropName.Size] as Size).set(trans.contentSize);
            } break;
            case EnumPropName.Color: {
                let sprite_label = itself.node.getComponent(Sprite) || itself.node.getComponent(Label);
                if (!sprite_label) {
                    return;
                }
                (getPropData[EnumPropName.Color] as Color).set(sprite_label.color);
            } break;
            case EnumPropName.Opacity: {
                let opacity = itself.node.getComponent(UIOpacity);
                if (!opacity) {
                    return;
                }
                getPropData[EnumPropName.Opacity] = opacity.opacity;
            } break;
            case EnumPropName.GrayScale: {
                let sprite = itself.node.getComponent(Sprite);
                if (!sprite) {
                    return;
                }
                getPropData[EnumPropName.GrayScale] = sprite.grayscale;
            } break;
        }
        if (type == itself.propKey) {
            let propData = itself.getPropData();
            itself._propValue = propData[itself.propKey];
        }
    }

    /** 显示隐藏 */
    private getActive() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Active) as boolean;
        if (value == void 0) {
            value = itself.node.active;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Active] == void 0) {
                defaultData[EnumPropName.Active] = value;
            }
        }
        return value;
    }
    /** 获取位置 */
    private getPosition() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Position) as Vec3;
        if (value == void 0) {
            value = itself.node.getPosition();
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Position] == void 0) {
                defaultData[EnumPropName.Position] = itself.node.getPosition();
            }
        }
        return value;
    }
    // /** 旋转、四元数 */
    // private getRotation() {
    //     let itself = this;
    //     let value = itself.getPropValue(EnumPropName.Rotation) as Quat;
    //     if (value == void 0) {
    //         value = itself.node.getRotation();
    //         let defaultData = itself.getDefaultData();
    //         defaultData[EnumPropName.Rotation] = itself.node.getRotation();
    //     }
    //     return value;
    // }
    /** 旋转、欧拉角 */
    private getEuler() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Euler) as Vec3;
        if (value == void 0) {
            value = Vec3.copy(new Vec3(), itself.node.eulerAngles);
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Euler] == void 0) {
                defaultData[EnumPropName.Euler] = Vec3.copy(new Vec3(), itself.node.eulerAngles);
            }
        }
        return value;
    }
    /** 缩放 */
    private getScale() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Scale) as Vec3;
        if (value == void 0) {
            value = itself.node.getScale();
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Scale] == void 0) {
                defaultData[EnumPropName.Scale] = itself.node.getScale();
            }
        }
        return value;
    }
    /** 锚点 */
    private getAnchor() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Anchor) as Vec2;
        if (value == void 0) {
            let trans = itself.node.getComponent(UITransform);
            if (!trans) {
                return void 0;
            }
            value = Vec2.copy(new Vec2(), trans.anchorPoint);
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Anchor] == void 0) {
                defaultData[EnumPropName.Anchor] = Vec2.copy(new Vec2(), trans.anchorPoint);
            }
        }
        return value;
    }
    /** 宽高 */
    private getSize() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Size) as Size;
        if (value == void 0) {
            let trans = itself.node.getComponent(UITransform);
            if (!trans) {
                return void 0;
            }
            value = trans.contentSize.clone();
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Size] == void 0) {
                defaultData[EnumPropName.Size] = trans.contentSize.clone();
            }
        }
        return value;
    }
    /** 颜色 */
    private getColor() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Color) as Color;
        if (value == void 0) {
            let sprite_label = itself.node.getComponent(Sprite) || itself.node.getComponent(Label);
            if (!sprite_label) {
                return void 0;
            }
            value = sprite_label.color.clone();
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Color] == void 0) {
                defaultData[EnumPropName.Color] = sprite_label.color.clone();
            }
        }
        return value;
    }
    /** 透明度 */
    private getOpacity() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Opacity) as number;
        if (value == void 0) {
            let opacity = itself.node.getComponent(UIOpacity);
            if (!opacity) {
                return void 0;
            }
            value = opacity.opacity;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Opacity] == void 0) {
                defaultData[EnumPropName.Opacity] = value;
            }
        }
        return value;
    }
    /** 灰度 */
    private getGrayScale() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.GrayScale) as boolean;
        if (value == void 0) {
            let sprite = itself.node.getComponent(Sprite);
            if (!sprite) {
                return void 0;
            }
            value = sprite.grayscale;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.GrayScale] == void 0) {
                defaultData[EnumPropName.GrayScale] = value;
            }
        }
        return value;
    }
    /** 文本 */
    private getLabel() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Label) as string;
        if (value == void 0) {
            let label = itself.node.getComponent(Label);
            if (!label) {
                return void 0;
            }
            value = label.string;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Label] == void 0) {
                defaultData[EnumPropName.Label] = value;
            }
        }
        return value;
    }
    /** 字体 */
    private getFont() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.Font) as Font;
        if (value == void 0) {
            let label = itself.node.getComponent(Label);
            if (!label) {
                return void 0;
            }
            value = label.font;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.Font] == void 0) {
                defaultData[EnumPropName.Font] = value;
            }
        }
        return value;
    }
    /** 文本描边 */
    private getLabelOutline() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.LabelOutline) as Color;
        if (value == void 0) {
            let labelOutline = itself.node.getComponent(LabelOutline);
            if (!labelOutline) {
                return void 0;
            }
            value = labelOutline.color.clone();
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.LabelOutline] == void 0) {
                defaultData[EnumPropName.LabelOutline] = value.clone();
            }
        }
        return value;
    }
    /** 图片 */
    private getSpriteFrame() {
        let itself = this;
        let value = itself.getPropValue(EnumPropName.SpriteFrame) as SpriteFrame;
        if (value == void 0) {
            let sprite = itself.node.getComponent(Sprite);
            if (!sprite) {
                return void 0;
            }
            value = sprite.spriteFrame;
            let defaultData = itself.getDefaultData();
            if (defaultData[EnumPropName.SpriteFrame] == void 0) {
                defaultData[EnumPropName.SpriteFrame] = value;
            }
        }
        return value;
    }

    /** 父节点改变，转换已经缓存的位置 */
    private transPosition(oldParent: Node) {
        if (!EDITOR) {
            return;
        }
        let itself = this;
        let parent = itself.node.parent;
        if (!parent || !oldParent) {
            return;
        }
        let pageData = itself.getPageData();
        let transCurr = parent.getComponent(UITransform);
        if (!transCurr) {
            transCurr = parent.addComponent(UITransform);
            transCurr["__delete__"] = true;
        }
        let transOld = oldParent.getComponent(UITransform);
        if (!transOld) {
            transOld = oldParent.addComponent(UITransform);
            transOld["__delete__"] = true;
        }
        for (let state in pageData) {
            let propData = pageData[state];
            let pos = propData[EnumPropName.Position] as Vec3;
            if (pos) {
                transCurr.convertToNodeSpaceAR(transOld.convertToWorldSpaceAR(pos), pos);
            }
        }
        if (transCurr["__delete__"]) {
            transCurr._onPreDestroy();
        }
        if (transOld["__delete__"]) {
            transOld._onPreDestroy();
        }
    }
}

