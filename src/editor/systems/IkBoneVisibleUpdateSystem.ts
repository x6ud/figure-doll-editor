import EditorContext from '../EditorContext';
import CIkNode from '../model/components/CIkNode';
import UpdateSystem from '../utils/UpdateSystem';

export default class IkBoneVisibleUpdateSystem extends UpdateSystem<EditorContext> {
    private showIkBones = false;

    setup(ctx: EditorContext) {
        this.showIkBones = ctx.options.showIkBones;
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.options.showIkBones !== this.showIkBones) {
            this.showIkBones = ctx.options.showIkBones;
            ctx.model.forEach(node => {
                if (node.has(CIkNode)) {
                    const cIkNode = node.get(CIkNode);
                    if (cIkNode.boneMesh) {
                        cIkNode.boneMesh.visible = ctx.options.showIkBones;
                    }
                }
            });
        }
    }

    end(ctx: EditorContext): void {
    }
}
