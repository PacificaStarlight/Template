import { Node, resources, director, Animation, Vec3, AnimationClip, ParticleSystem2D, instantiate, Prefab } from 'cc';

export class EffectsManager {
    private static particles: Map<string, ParticleSystem2D> = new Map();


    // 播放特效
    public static playEffect(effect: string | AnimationClip, pos: Vec3, scale: number = 1.0) {

    }

    // 播放粒子特效
    public static playParticle(effect: ParticleSystem2D | string, pos?: Vec3) {
        if (effect instanceof ParticleSystem2D) {
            effect.resetSystem();
            effect.node.setWorldPosition(pos);
        }
    }

    // 播放一次粒子特效
    public static playOnceParticle(effect: ParticleSystem2D | string, pos?: Vec3, parent?: Node) {
        if (effect instanceof ParticleSystem2D) {
            if (parent != null) {
                effect.node.parent = parent;
            }
            if (pos != null) {
                effect.node.setWorldPosition(pos);
            }
            effect.autoRemoveOnFinish = true;
            effect.resetSystem();
        }
        else {
            resources.load(effect, (err, particle: Prefab) => {
                if (err) {
                    console.error(err);
                    return;
                }
                let node = instantiate(particle);
                let particleSystem2D = node.getComponent(ParticleSystem2D);
                if (parent != null) {
                    particleSystem2D.node.parent = parent;
                }
                if (pos != null) {
                    particleSystem2D.node.setWorldPosition(pos);
                }
                particleSystem2D.autoRemoveOnFinish = true;
                particleSystem2D.resetSystem();
            })
        }
    }

    public static stopParticle(effect: ParticleSystem2D | string) {
        if (effect instanceof ParticleSystem2D) {
            effect.stopSystem();
        }
    }
}