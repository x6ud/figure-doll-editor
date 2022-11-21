import EditorContext from '../EditorContext';
import UpdateSystem from '../utils/UpdateSystem';

export default class MouseSystem extends UpdateSystem<EditorContext> {

    begin(ctx: EditorContext): void {
        for (let view of ctx.views) {
            if (view.enabled) {
                view.mouseScr.x = view.input.mouseX;
                view.mouseScr.y = view.height - view.input.mouseY;
                view.mouseNdc.x = view.mouseScr.x / view.width * 2 - 1;
                view.mouseNdc.y = view.mouseScr.y / view.height * 2 - 1;
                view.mouseRay0.copy(view.mouseNdc);
                view.mouseRay0.z = -1;
                view.mouseRay0.unproject(view.camera.get());
                view.mouseRay1.copy(view.mouseNdc);
                view.mouseRay1.z = +1;
                view.mouseRay1.unproject(view.camera.get());
                view.mouseRayN.subVectors(view.mouseRay1, view.mouseRay0).normalize();
                view.raycaster.setFromCamera(view.mouseNdc, view.camera.get());
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
