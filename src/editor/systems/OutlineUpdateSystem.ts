import {Object3D} from 'three';
import EditorContext from '../EditorContext';
import CObject3D from '../model/components/CObject3D';
import UpdateSystem from '../utils/UpdateSystem';

export default class OutlineUpdateSystem extends UpdateSystem<EditorContext> {
    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (!ctx.options.outlineSelected) {
            ctx.outlinePass.selectedObjects.length = 0;
            ctx.outlinePass.enabled = false;
            return;
        }
        const selected = ctx.model.getSelectedNodes();
        const selectedObjs: Object3D[] = [];
        for (let node of selected) {
            if (node.has(CObject3D)) {
                const obj = node.value(CObject3D);
                if (obj) {
                    selectedObjs.push(obj);
                }
            }
        }
        ctx.outlinePass.selectedObjects = selectedObjs;
        ctx.outlinePass.enabled = !!selectedObjs.length;
    }

    end(ctx: EditorContext): void {
    }
}
