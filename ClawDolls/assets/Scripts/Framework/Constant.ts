/** 游戏状态 */
enum GAME_RUN_STATE {
    RUNNING = 0,
    TESTING = 1,
}

/** 移动类型 */
enum MOVE_TYPE {
    NONE = 0,
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4,
}

/** 事件名字 */
enum EVENT_TYPE {
    // UIManager----------------------------------------------------
    /** UIManager 改变引导图片 */
    CHANGE_GUIDE = 'ChangeGuide',
    /** UIManager 游戏结束 */
    GAME_OVER = 'GameOver',
    // InputManager----------------------------------------------------
    /** InputManager 初始化块 */
    INIT_BLOCKS = 'InitBlocks',
    CHANGE_SHOW_IMAGE = 'ChangeShowImage',
}

/** 动画名称 */
enum ANIM_CLIP {

}

/** 音效类型 */
enum AUDIO_TYPE {
    BGM = 'Audios/bgm', // 背景音乐

    BUTTON = 'Audios/button_SFX', // 按钮音效
    CLICK = 'Audios/click_SFX', // 点击音效

    SUCCESS_SFX = 'Audios/success_SFX', // 成功音效
    FAIL_SFX = 'Audios/fail_SFX', // 失败音效

    POS_SFX_1 = 'Audios/pos_SFX_1', // 积极反馈音效1
    POS_SFX_SUCCESS = 'Audios/pos_SFX_success', // 积极反馈音效 - 成功

    NEG_SFX_1 = 'Audios/neg_SFX_1', // 消极反馈音效1
    NEG_SFX_FAIL = 'Audios/neg_SFX_fail',   // 消极反馈音效 - 失败

    TIP_SFX_1 = 'Audios/tip_SFX_1', // 提示音效1
    TIP_SFX_DU = 'Audios/tip_SFX_du',   // 提示音效 - 嘟声
}

/** 块类型 */
export enum BLOCK_TYPE {
    BLOCK,
}

/** 资源路径 */
export enum RES_PATH {
    BLOCK,
}

/** 玩家状态 */
export enum PLAYER_STATE {
    NONE,
    /** 摇摆 */
    IDLE,
    /** 向上移动 */
    MOVEING,
    /** 朝上 */
    UP,
    JUMP,
    /** 下落 */
    FALLING,
    /** 开始 */
    START,
    /** 准备 */
    READY,
    /** 停止 */
    STOP,
}

/** 常量存储 */
export class Constant {

    /** 游戏状态 */
    public static GAME_RUN_STATE = GAME_RUN_STATE;

    /** 移动类型 */
    public static MOVE_TYPE = MOVE_TYPE;

    /** 事件名字 */
    public static EVENT_TYPE = EVENT_TYPE;

    /** 动画名称 */
    public static ANIM_CLIP = ANIM_CLIP;

    /** 音效类型 */
    public static AUDIO_TYPE = AUDIO_TYPE;

    /** 块类型 */
    public static BLOCK_TYPE = BLOCK_TYPE;

    /** 资源路径 */
    public static RES_PATH = RES_PATH;

    /** 玩家状态 */
    public static PLAYER_STATE = PLAYER_STATE;
}