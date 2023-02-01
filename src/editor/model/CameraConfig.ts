export default class CameraConfig {
    name: string = '';
    zoomLevel: number = 0;
    alpha: number = 0;
    beta: number = 0;
    target: [number, number, number] = [0, 0, 0];
    perspective: boolean = true;
    fov: number = 45;
}
