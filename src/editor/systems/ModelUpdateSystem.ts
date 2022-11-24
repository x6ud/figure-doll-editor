import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import ModelNode from '../model/ModelNode';
import UpdateSystem from '../utils/UpdateSystem';

export interface ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void;
}

export default class ModelUpdateSystem extends UpdateSystem<EditorContext> {

    private readonly filters: ModelNodeUpdateFilter[];

    constructor(filters: ModelNodeUpdateFilter[]) {
        super();
        this.filters = filters;
    }

    begin(ctx: EditorContext): void {
        ctx = toRaw(ctx);
        if (ctx.model.dirty) {
            ctx.model.forEach(node => {
                if (node.dirty) {
                    for (let filter of this.filters) {
                        filter.update(ctx, node);
                    }
                    node.dirty = false;
                }
            });
            ctx.model.dirty = false;
        }
    }

    end(ctx: EditorContext): void {
    }

}
