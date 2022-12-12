import EditorContext from '../EditorContext';
import CObject3D from '../model/components/CObject3D';
import UpdateSystem from '../utils/UpdateSystem';

export default class EdgeVisibilityUpdateSystem extends UpdateSystem<EditorContext> {
    private prevState = false;

    setup(ctx: EditorContext) {
        this.prevState = ctx.showEdges;
    }

    begin(ctx: EditorContext): void {
        if (this.prevState === ctx.showEdges) {
            return;
        }
        this.prevState = ctx.showEdges;
        ctx.model.nodes.forEach(node => {
            if (node.has(CObject3D)) {
                const cObject3D = node.get(CObject3D);
                if (cObject3D.edge) {
                    cObject3D.edge.visible = ctx.showEdges;
                }
            }
        });
    }

    end(ctx: EditorContext): void {
    }
}
