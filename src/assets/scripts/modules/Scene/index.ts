import { Color, Mesh, PlaneGeometry, RawShaderMaterial, Vector2, EventDispatcher } from 'three';

import { BaseThree } from '../BaseThree';

import vertexShader from '../../glsl/scene/vertex.glsl';
import fragmentShader from '../../glsl/scene/fragment.glsl';

export class Scene extends BaseThree {
    animeFrameId: number | undefined;
    eventDispatcher: EventDispatcher;

    constructor() {
        super();
        this.el = document.querySelector('.scene');
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
                value: new Color('#e8fbe7'),
            },
            uColor2: {
                value: new Color('#ccebfb'),
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
}
