import { Node, AudioSource, AudioClip, resources, director } from 'cc';
// 这是一个用于播放音频的单件类，可以很方便地在项目的任何地方调用。
export class AudioManager {
    private static _audioSource: AudioSource; // 用于播放音频的 AudioSource 组件
    private static _isInitialized: boolean = false; // 是否已经初始化

    static {
        console.log("AudioManager静态初始化");
        this.init();
    }

    public static init() {
        if (this._isInitialized) {
            console.warn("AudioManager已经初始化过了");
            return;
        }

        // 创建音频管理器节点
        const audioNode = new Node();
        audioNode.name = 'AudioManager';

        // 添加AudioSource组件
        this._audioSource = audioNode.addComponent(AudioSource);

        this._isInitialized = true;
        console.log("EffectsManager初始化完成");
    }

    public static get audioSource() {
        return this._audioSource;
    }

    // 播放短音频,比如 打击音效，爆炸音效等
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

    // 播放长音频，比如 背景音乐
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

    // 停止播放音频
    public static stop() {
        this._audioSource.stop();
    }

    // 暂停播放音频
    public static pause() {
        this._audioSource.pause();
    }

    // 恢复播放音频
    public static resume() {
        this._audioSource.play();
    }
}