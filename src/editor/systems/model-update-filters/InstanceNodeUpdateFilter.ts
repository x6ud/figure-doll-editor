import EditorContext from '../../EditorContext';
import ModelNode from '../../model/ModelNode';
import {getModelNodeComponentDef} from '../../model/ModelNodeComponentDef';
import {ModelNodeUpdateFilter} from '../ModelUpdateSystem';

export default class InstanceNodeUpdateFilter implements ModelNodeUpdateFilter {
    update(ctx: EditorContext, node: ModelNode): void {
        if (node.instanceId) {
            const target = ctx.model.getNode(node.instanceId);
            for (let componentName in node.components) {
                const def = getModelNodeComponentDef(componentName);
                if (def.autoCopy) {
                    node.components[componentName].value = target.components[componentName].value;
                }
            }
        }
    }
}
