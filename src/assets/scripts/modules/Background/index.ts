import { Color, Mesh, PlaneGeometry, RawShaderMaterial, Vector2, EventDispatcher } from 'three';

import { Base } from '../BaseThree';

import vertexShader from '../../glsl/background/vertex.glsl';
import fragmentShader from '../../glsl/background/fragment.glsl';

const COLOR_LIST = ['#92b7d6', '#6ccedd', '#fcedb9', '#f4b266'];

export class Background extends Base {
    animeFrameId: number | undefined;
    eventDispatcher: EventDispatcher;

    constructor({ el }: { el: HTMLCanvasElement }) {
        super();
        this.el = el;
        this.eventDispatcher = new EventDispatcher();

        this.init();
    }

    private init(): void {
        this.onDispose();

        this.camera = this.initCamera();

        if (!this.el) return;
        this.renderer = this.initRenderer({
            canvas: this.el as HTMLCanvasElement,
        });

        this.resize();

        this.geometry = new PlaneGeometry(2, 2);
        this.material = this.initMaterial();
        this.mesh = new Mesh(this.geometry, this.material);

        if (this.scene) this.scene.add(this.mesh);

        this.render();
    }

    private initMaterial(): RawShaderMaterial {
        const uniforms = {
            uTime: {
                value: 0,
            },
            uScroll: {
                value: 0,
            },
            uColor1: {
                value: new Color('#eff6fe'),
            },
            uColor2: {
                value: new Color('#93d9fd'),
            },
            uResolution: {
                value: new Vector2(this.el?.offsetWidth),
            },
        };

        const material = new RawShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
        });

        return material;
    }

    private render() {
        this.elapsedTime = this.clock.getElapsedTime();

        if (!this.material) return;
        this.material.uniforms.uTime.value = this.elapsedTime;

        if (this.scene && this.camera) {
            this.renderer?.render(this.scene, this.camera);
        }

        this.animeFrameId = requestAnimationFrame(() => this.render());
    }

    public resize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (!this.renderer) return;
        this.renderer.setSize(width, height);

        if (this.material) {
            this.material.uniforms.uResolution.value = new Vector2(width, height);
        }
    }

    private onDispose(): void {
        if (this.animeFrameId !== undefined) {
            cancelAnimationFrame(this.animeFrameId);
            this.animeFrameId = undefined;
        }

        this.dispose();
    }

    public changeColor(index: number): void {
        if (!this.material) return;
        this.material.uniforms.uColor2.value = new Color(COLOR_LIST[index]);
        this.material.needsUpdate = true;
    }
}
