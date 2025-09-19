import { Node, AudioSource, AudioClip, resources } from 'cc';
// 这是一个用于播放音频的单件类，可以很方便地在项目的任何地方调用。
export class AudioManager {
    private static _audioSource: AudioSource; // 用于播放音频的 AudioSource 组件
    private static _loopAudioSource: AudioSource; // 用于播放循环音频的 AudioSource 组件
    private static _isInitialized: boolean = false; // 是否已经初始化

    static {
        console.log("AudioManager静态初始化");
        this.init();
    }

    /** 初始化音频管理器
     * 
     * @returns 返回音频管理器节点
     */
    public static init() {
        if (this._isInitialized) {
            console.warn("AudioManager已经初始化过了");
            return;
        }

        // 创建音频管理器节点
        const audioNode = new Node();
        const loopNode = new Node();

        audioNode.name = 'AudioManager';
        loopNode.name = 'LoopAudioManager';
        // 添加AudioSource组件
        this._audioSource = audioNode.addComponent(AudioSource);
        this._loopAudioSource = loopNode.addComponent(AudioSource);

        this._isInitialized = true;
        console.log("EffectsManager初始化完成");
    }

    private static get audioSource() {
        return this._audioSource;
    }

    /** 播放一次音频,比如 打击音效，爆炸音效等
     * 
     * @param sound 音频资源
     * @param volume 音量，默认为1.0
     */
    public static playOneShot(sound: AudioClip | string, volume: number = 1.0) {

        if (sound instanceof AudioClip) {
            this._audioSource.playOneShot(sound, volume);
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.playOneShot(clip, volume);
                }
            });
        }
    }

    /** 连续播放短音频指定次数（基于事件的精确控制）
     * 
     * @param sound - 要播放的音频剪辑或音频资源路径
     * @param volume - 播放音量，默认为 1.0
     * @param times - 播放次数，默认为 10 次
     * @param interval - 播放间隔系数，用于控制播放间隔时间，默认为 200
     */
    public static playLoop(sound: AudioClip | string, volume: number = 1.0, times: number = 10, interval: number = 200) {
        if (times <= 0) return;

        const playSequentially = (clip: AudioClip, remainingTimes: number) => {
            if (remainingTimes <= 0) return;
            // 设置音频剪辑并播放
            this._loopAudioSource.clip = clip;
            this._loopAudioSource.volume = volume;
            this._loopAudioSource.loop = false;
            this._loopAudioSource.play();

            // 计算音频时长
            const clipDuration = clip.getDuration();
            // 在音频播放一半时开始下一次播放
            if (clipDuration > 0 && remainingTimes > 1) {
                setTimeout(() => {
                    playSequentially(clip, remainingTimes - 1);
                }, clipDuration * interval); // 500 = 1000ms * 0.5
            }
            // 监听播放完成事件，用于最后一次播放的清理
            const onEnded = () => {
                this._loopAudioSource.node.off(AudioSource.EventType.ENDED, onEnded);
                // 如果是最后一次播放，不需要再调用递归
                if (remainingTimes > 1 && clipDuration <= 0) {
                    // 如果无法获取时长，则依赖事件
                    playSequentially(clip, remainingTimes - 1);
                }
            };
            this._loopAudioSource.node.once(AudioSource.EventType.ENDED, onEnded);
        };

        if (sound instanceof AudioClip) {
            playSequentially(sound, times);
        } else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.error('音频加载失败:', err);
                } else {
                    playSequentially(clip, times);
                }
            });
        }
    }

    /** 播放长音频，比如 背景音乐
     * 
     * @param sound 音频资源
     * @param volume 音量，默认为1.0
     */
    public static play(sound: AudioClip | string, volume: number = 1.0) {
        if (sound instanceof AudioClip) {
            this._audioSource.stop();
            this._audioSource.loop = true;
            this._audioSource.clip = sound;
            this._audioSource.play();
            this.audioSource.volume = volume;
        }
        else {
            resources.load(sound, (err, clip: AudioClip) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this._audioSource.stop();
                    this._audioSource.loop = true;
                    this._audioSource.clip = clip;
                    this._audioSource.play();
                    this.audioSource.volume = volume;
                }
            });
        }
    }

    /** 停止播放音频
     * 
     */
    public static stop() {
        this._audioSource.stop();
    }

    /** 暂停播放音频
     * 
     */
    public static pause() {
        this._audioSource.pause();
    }

    /** 恢复播放音频
     * 
     */
    public static resume() {
        this._audioSource.play();
    }
}