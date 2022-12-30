import EditorContext from '../EditorContext';
import CVisible from '../model/components/CVisible';
import ModelNode from '../model/ModelNode';
import UpdateSystem from '../utils/UpdateSystem';

export interface ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void;
}

const dirtyNodes: ModelNode[] = [];

export default class ModelUpdateSystem extends UpdateSystem<EditorContext> {

    private readonly filters: ModelNodeUpdateFilter[];

    constructor(filters: ModelNodeUpdateFilter[]) {
        super();
        this.filters = filters;
    }

    begin(ctx: EditorContext): void {
        ctx = ctx.readonlyRef();
        if (ctx.model.dirty) {
            ctx.model.forEach(node => {
                if (node.parent && !node.parent.visible) {
                    node.visible = false;
                } else {
                    node.visible = node.has(CVisible) ? node.value(CVisible) : true;
                }
                if (node.dirty) {
                    dirtyNodes.push(node);
                }
            });
            for (let filter of this.filters) {
                for (let node of dirtyNodes) {
                    filter.update(ctx, node);
                }
            }
            for (let node of dirtyNodes) {
                node.dirty = false;
            }
            dirtyNodes.length = 0;
            ctx.model.dirty = false;
        }
    }

    end(ctx: EditorContext): void {
    }

}
