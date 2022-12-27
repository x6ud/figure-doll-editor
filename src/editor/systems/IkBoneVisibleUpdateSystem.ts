import EditorContext from '../EditorContext';
import CIkNode from '../model/components/CIkNode';
import UpdateSystem from '../utils/UpdateSystem';

export default class IkBoneVisibleUpdateSystem extends UpdateSystem<EditorContext> {
    private showIkBones = false;

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.showIkBones !== this.showIkBones) {
            this.showIkBones = ctx.showIkBones;
            ctx.model.forEach(node => {
                if (node.has(CIkNode)) {
                    const cIkNode = node.get(CIkNode);
                    if (cIkNode.mesh) {
                        cIkNode.mesh.visible = ctx.showIkBones;
                    }
                }
            });
        }
    }

    end(ctx: EditorContext): void {
    }
}
