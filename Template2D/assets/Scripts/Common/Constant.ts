/** 游戏状态 */
export enum Game_Run_State {
    Running = 0,
    GameOver = 1,
}

/** 事件名字 */
export enum EventName {
    // UI------------------------------------------------------------------------
    Set_Guide_Active = 'Set_Guide_Active',   // 切换引导界面
    Game_Over = 'GameOver', // 游戏结束

    // InputManager-------------------------------------------------------------
    IsFirTouch = 'IsFirstTouch',           // 是否是第一次触摸
}

/** 音效类型 */
export enum AudioName {
    BGM = 'Audios/bgm', // 背景音乐

    SFX_Button = 'Audios/button', // 按钮音效
    SFX_Click = 'Audios/click', // 点击音效

    SFX_Success = 'Audios/success', // 成功音效
    SFX_Fail = 'Audios/fail', // 失败音效
    SFX_Right = 'Audios/right', // 积极反馈音效 - 正确
    SFX_Wrong = 'Audios/wrong',   // 消极反馈音效 - 错误
    SFX_Upgrade = 'Audios/upgrade', // 升级音效
}

/** 资源路径 */
export enum ResPath {
    Block = 'Prefabs/Blocks/Block',
}

/** 常量存储 */
export class Constant {

}
