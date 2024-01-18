import { Color, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, ShaderMaterial, Uniform, Vector2 } from 'three';
import { EffectComposer, RenderPass, EffectPass } from 'postprocessing';

import { TouchTexture } from '../TouchTexture';
import { Base } from '../BaseThree';
import { Planes } from '../Planes';
import { WaterEffect } from '../WaterEffect';
import { LoaderCheck } from '../LoaderCheck';
import { Text } from '../Text';

import vertexShader from '../../glsl/distortion/vertex.glsl';
import fragmentShader from '../../glsl/distortion/fragment.glsl';
import { Background } from '../Background';

type ViewSizeOption = {
    width: number;
    height: number;
};

export class Distortion extends Base {
    private touchTexture: TouchTexture | null = null;
    private composer: EffectComposer | null = null;
    public raycaster: Raycaster | null = null;
    private hitObjects: Mesh[] = [];
    private data: {
        text: string[];
        images: string[];
    } | null = null;
    private planes: Planes | null = null;
    private text: Text | null = null;
    private subjects: (Planes | Text)[] = [];
    private waterEffect: WaterEffect | null = null;
    private loaderCheck: LoaderCheck | null = null;
    protected background: Background | null = null;

    constructor() {
        super();
        this.el = document.querySelector('.distortion');

        void this.setup();
    }

    private async setup(): Promise<void> {
        if (!this.scene || !this.el) return;

        this.renderer = this.initRenderer({
            antialias: false,
        });
        if (this.renderer) {
            this.el.appendChild(this.renderer.domElement);
            // ポストプロセッシング
            // 参考にしたサイト：https://blog.design-nkt.com/osyare-threejs11/
            // コンポーザーを生成
            this.composer = new EffectComposer(this.renderer);
        }

        this.perspectiveCamera = this.initPerspectiveCamera();
        this.perspectiveCamera.position.z = 50;

        this.raycaster = new Raycaster();

        this.touchTexture = new TouchTexture();

        this.data = {
            text: ['SEA', 'MORNING', 'AFTERNOON', 'EVENING'],
            images: ['assets/images/image01.jpg', 'assets/images/image02.jpg', 'assets/images/image03.jpg'],
        };

        this.planes = new Planes(this, this.data.images);
        this.text = new Text(this, this.data.text);
        this.subjects = [this.planes, this.text];

        this.loaderCheck = new LoaderCheck();
        await this.loadAssets().then(() => {
            this.init();
        });
    }

    private init(): void {
        this.initBackground();
        if (this.touchTexture) this.touchTexture.initTexture();
        this.initTextPlane();
        this.addHitPlane();
        this.subjects.forEach((subject) => subject.init());
        this.initComposer();

        this.tick();
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('touchmove', this.onTouchMove.bind(this));
    }

    private initBackground(): void {
        const background = document.querySelector('[data-bg-canvas]') as HTMLCanvasElement;
        if (background) this.background = new Background({ el: background });
    }

    private initTextPlane(): void {
        if (!this.touchTexture) return;

        const viewSize = this.getViewSize();

        const geometry = new PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

        const uniforms = {
            uMap: new Uniform(this.touchTexture.texture),
            uLines: new Uniform(5),
            uLineWidth: new Uniform(0.01),
            uLineColor: new Uniform(new Color(0x202030)),
        };

        const material = new ShaderMaterial({
            uniforms,
            transparent: true,
            vertexShader,
            fragmentShader,
        });

        const mesh = new Mesh(geometry, material);
        mesh.position.z = -0.001;
        this.scene?.add(mesh);
    }

    // ホバー&タッチ検知用のプレーンを追加
    private addHitPlane(): void {
        const viewSize = this.getViewSize();
        const geometry = new PlaneGeometry(
            viewSize.width, //
            viewSize.height, //
            1, //
            1 //
        );
        const material = new MeshBasicMaterial();
        const mesh = new Mesh(geometry, material);
        this.hitObjects.push(mesh);
    }

    // ポストプロセッシング
    private initComposer(): void {
        if (!this.scene || !this.perspectiveCamera) return;
        //レンダーパスを生成
        const renderPass = new RenderPass(this.scene, this.perspectiveCamera);
        if (!this.touchTexture || !this.touchTexture.texture) return;
        this.waterEffect = new WaterEffect({ texture: this.touchTexture.texture });
        const waterPass = new EffectPass(this.perspectiveCamera, this.waterEffect);
        // renderToScreen: エフェクトをかけいた映像を画面に映す
        renderPass.renderToScreen = false;
        waterPass.renderToScreen = true;
        this.composer?.addPass(renderPass);
        this.composer?.addPass(waterPass);
    }

    private async loadAssets(): Promise<void> {
        const loaderCheck = this.loaderCheck as LoaderCheck;

        await Promise.all(
            this.subjects.map(async (subject) => {
                await subject.load(loaderCheck);
            })
        );

        loaderCheck.onComplete();
    }

    private tick(): void {
        this.render();
        this.update();
        requestAnimationFrame(this.tick.bind(this));
    }

    private render(): void {
        const delta = this.clock.getDelta();
        this.composer?.render(delta);
    }

    private update(): void {
        if (!this.touchTexture) return;
        this.touchTexture.update();
        this.subjects.forEach((subject) => subject.update());
    }

    private onMouseMove(e: Partial<MouseEvent>): void {
        const raycaster = this.raycaster as Raycaster;
        /**
         *  (0,0)|         (3,0)
         *       |
         *  (0,3)|________ (3,3)
         */
        if (e.clientX == undefined || e.clientY == undefined) return;
        const mouse = {
            // https://blog.design-nkt.com/osyare-threejs13/
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight,
        };

        this.touchTexture?.addPoint(mouse);

        if (!this.perspectiveCamera) return;
        raycaster.setFromCamera(
            new Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1),
            this.perspectiveCamera
        );

        this.subjects.forEach((subject) => {
            if (subject.onMouseMove) {
                subject.onMouseMove(e);
            }
        });

        if (this.planes) {
            if (this.text) {
                this.text.changeText(this.planes.hovering + 1);
            }

            if (this.background) {
                this.background.changeColor(this.planes.hovering + 1);
            }
        }
    }

    private onTouchMove(e: TouchEvent): void {
        const touch = e.targetTouches[0];
        this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    public resize(): void {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        if (this.perspectiveCamera) {
            this.perspectiveCamera.aspect = winW / winH;
            this.perspectiveCamera.updateProjectionMatrix();
        }

        this.composer?.setSize(winW, winH);
        this.subjects.forEach((subject) => {
            subject.ouResize(winW, winH);
        });

        if (this.background) {
            this.background.resize();
        }
    }

    public getViewSize(): ViewSizeOption {
        if (this.perspectiveCamera) {
            const fov = (this.perspectiveCamera.fov * Math.PI) / 180;
            // 正の数を返す
            const height = Math.abs(this.perspectiveCamera.position.z * Math.tan(fov / 2) * 2);
            return { width: height * this.perspectiveCamera.aspect, height };
        } else {
            return { width: 0, height: 0 };
        }
    }
}
