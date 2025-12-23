/** 游戏状态 */
enum GAME_RUN_STATE {
    RUNNING = 0,
    GAMEOVER = 1,
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
    // UI------------------------------------------------------------------------
    CHANGE_GUIDE = 'ChangeGuide',   // 切换引导界面
    GAME_START = 'GameStart',   // 游戏开始
    GAME_OVER = 'GameOver', // 游戏结束

    // InputManager-------------------------------------------------------------
    PLAY_BGM = 'PlayBGM',           // 播放背景音乐
}

/** 动画名称 */
enum ANIM_CLIP {
    BUTTON_JUMP = 'Anims/ButtonJump', // 按钮跳跃动画
}

/** 音效类型 */
enum AUDIO_TYPE {
    BGM = 'Audios/bgm', // 背景音乐

    BUTTON = 'Audios/button', // 按钮音效
    CLICK = 'Audios/click', // 点击音效

    SUCCESS_SFX = 'Audios/success_SFX', // 成功音效
    FAIL_SFX = 'Audios/success_SFX', // 失败音效
    POS_SFX_SUCCESS = 'Audios/pos_SFX_success', // 积极反馈音效 - 成功
    NEG_SFX_FAIL = 'Audios/pos_SFX_success',   // 消极反馈音效 - 失败
    GUIDE_TIP = 'Audios/guideTip', // 引导提示音效
    UNLOCK = 'Audios/unlock', // 解锁音效
    UPGRADE = 'Audios/upgrade', // 升级音效
    BOARD = 'Audios/board', // 板子音效
    GETCOIN = 'Audios/getCoin', // 获取金币音效
    HUIWU = 'Audios/huiwu', // 回物音效
    SPAWNCOIN = 'Audios/spawnCoin', // 掉落金币音效
    WAVESOUND = 'Audios/waveSound', // 音浪音效
}

/** 块类型 */
export enum BLOCK_TYPE {
    BLOCK1 = 1,
    BLOCK2 = 2,
    BLOCK3 = 3,
    BLOCK4 = 4,
    BLOCK5 = 5,
    BLOCK6 = 6,
    BLOCK7 = 7,
    BLOCK8 = 8,
    BLOCK9 = 9,
    BLOCK10 = 10,
    BLOCK11 = 11,
    BLOCK12 = 12,
    BLOCK13 = 13,
    BLOCK14 = 14,
    BLOCK15 = 15,
}

/** 资源路径 */
export enum RES_PATH {
    BLOCK = 'Prefabs/Blocks/Block',
    PARTICLE = 'Prefabs/Particle',
    GRID = 'Prefabs/Grids/Grid',
}

/** 常量存储 */
export class Constant {

    /** 游戏状态 */
    public static GAME_RUN_STATE = GAME_RUN_STATE;

    /** 移动类型 */
    public static MOVE_TYPE = MOVE_TYPE;

    /** 事件名字 */
    public static EVENT_TYPE = EVENT_TYPE;

    /** 资源路径 */
    public static RES_PATH = RES_PATH;

    /** 动画名称 */
    public static ANIM_CLIP = ANIM_CLIP;

    /** 音效类型 */
    public static AUDIO_TYPE = AUDIO_TYPE;

    /** 块类型 */
    public static BLOCK_TYPE = BLOCK_TYPE;

}