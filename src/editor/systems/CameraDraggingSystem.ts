import {Vector3} from 'three';
import EditorContext from '../EditorContext';
import {linePanelIntersection} from '../utils/math';
import UpdateSystem from '../utils/UpdateSystem';

class CameraDraggingState {
    mouseNdc0 = new Vector3();
    rotating = false;
    eulerX0 = 0;
    eulerY0 = 0;
    moving = false;
    target0 = new Vector3();
    mouseRayN0 = new Vector3();
}

const _mouseRay0 = new Vector3();
const _mouseRay1 = new Vector3();
const _mouse0 = new Vector3();
const _mouse1 = new Vector3();
const _det = new Vector3();

const MAX_ZOOM = 40;
const MIN_ZOOM = -20;
const ZOOM_STEP = 2.5;

export default class CameraDraggingSystem extends UpdateSystem<EditorContext> {

    states: CameraDraggingState[] = [
        new CameraDraggingState(),
        new CameraDraggingState(),
        new CameraDraggingState(),
        new CameraDraggingState(),
    ];

    begin(ctx: EditorContext): void {
        if (ctx.disableCameraDraggingThisFrame) {
            ctx.disableCameraDraggingThisFrame = false;
            return;
        }

        let changedIndex = -1;
        for (let view of ctx.views) {
            const state = this.states[view.index];
            if (!view.enabled) {
                state.rotating = false;
                state.moving = false;
                continue;
            }
            const input = view.input;

            // rotate
            if (view.index === ctx.mainViewIndex) {
                if (input.mouseRight) {
                    if (state.rotating) {
                        const dx = view.mouseNdc.x - state.mouseNdc0.x;
                        const dy = view.mouseNdc.y - state.mouseNdc0.y;
                        view.camera.alpha = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, state.eulerX0 + dy * Math.PI / 2));
                        view.camera.beta = (state.eulerY0 - dx * Math.PI / 2) % (Math.PI * 2);
                    } else if (input.mouseOver && input.mouseRightDownThisFrame) {
                        state.rotating = true;
                        state.mouseNdc0.copy(view.mouseNdc);
                        state.eulerX0 = view.camera.alpha;
                        state.eulerY0 = view.camera.beta;
                    }
                } else {
                    state.rotating = false;
                }
            }

            // move
            if (input.mouseMiddle) {
                if (state.moving) {
                    _mouseRay0.copy(state.mouseNdc0);
                    _mouseRay0.z = -1;
                    _mouseRay0.unproject(view.camera.get());
                    _mouseRay1.copy(state.mouseNdc0);
                    _mouseRay1.z = +1;
                    _mouseRay1.unproject(view.camera.get());
                    linePanelIntersection(_mouse0, _mouseRay0, _mouseRay1, state.target0, state.mouseRayN0);
                    linePanelIntersection(_mouse1, view.mouseRay0, view.mouseRay1, state.target0, state.mouseRayN0);
                    _det.subVectors(_mouse1, _mouse0);
                    view.camera.target.subVectors(state.target0, _det);
                    changedIndex = view.index;
                } else if (input.mouseOver && input.mouseMiddleDownThisFrame) {
                    state.moving = true;
                    state.target0.copy(view.camera.target);
                    state.mouseNdc0.copy(view.mouseNdc);
                    state.mouseRayN0.copy(view.mouseRayN);
                }
            } else {
                state.moving = false;
            }

            // zoom
            if (input.wheelDetY && input.mouseOver) {
                view.zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoomLevel + input.wheelDetY));
                changedIndex = view.index;
            }
        }

        if (changedIndex >= 0 && changedIndex !== ctx.mainViewIndex) {
            const changed = ctx.views[changedIndex];
            for (let view of ctx.views) {
                if (view.index !== ctx.mainViewIndex && view.index !== changedIndex && view.enabled) {
                    view.camera.target.copy(changed.camera.target);
                    view.zoomLevel = changed.zoomLevel;
                }
            }
        }

        for (let view of ctx.views) {
            if (view.enabled) {
                view.camera.distance = view.zoomLevel >= 0 ?
                    ZOOM_STEP + view.zoomLevel
                    : ZOOM_STEP - (view.zoomLevel / MIN_ZOOM) * ZOOM_STEP;
            }
        }
    }

    end(ctx: EditorContext): void {
    }

}
