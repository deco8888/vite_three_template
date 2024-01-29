import { Scene } from './modules/Scene';

export class App {
    protected scene: Scene | null = null;

    constructor() {
        this.init();
    }

    private init() {
        this.scene = new Scene();

        window.addEventListener('resize', this.onResize.bind(this));
    }

    private onResize(): void {
        if (this.scene) this.scene.resize();
    }
}
