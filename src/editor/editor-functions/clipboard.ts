import EditorContext from '../EditorContext';
import {ModelNodeCreationInfo} from '../model/ModelHistory';
import ModelNode, {ModelNodeJson} from '../model/ModelNode';
import {DataType, getModelNodeComponentDef} from '../model/ModelNodeComponentDef';
import {getModelNodeDef} from '../model/ModelNodeDef';
import {dataUrlToArrayBuffer} from '../utils/convert';

export async function cutModelSelected(ctx: EditorContext, e?: KeyboardEvent): Promise<boolean> {
    const targets = await copyModelSelected(ctx, e);
    if (targets) {
        for (let node of targets) {
            ctx.history.removeNode(node.id);
        }
        return true;
    }
    return false;
}

export async function copyModelSelected(ctx: EditorContext, e?: KeyboardEvent): Promise<ModelNode[] | void> {
    if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
        return;
    }
    const targets = ctx.model.getTopmostSelectedNodes();
    const clipboardContext: ModelNodeJson[] = [];
    for (let node of targets) {
        clipboardContext.push(await node.toJson());
    }
    await navigator.clipboard.writeText(JSON.stringify(clipboardContext));
    return targets;
}

export async function pastedModelNodes(ctx: EditorContext, e?: ModelNode | KeyboardEvent): Promise<boolean> {
    if (e && 'target' in e && (e.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
        return false;
    }
    try {
        let json = JSON.parse(await navigator.clipboard.readText()) as ModelNodeCreationInfo[];
        if (!Array.isArray(json)) {
            return false;
        }

        async function convertJsonToRealDataType(json: ModelNodeCreationInfo[]) {
            for (let node of json) {
                for (let name in node.data) {
                    const componentDef = getModelNodeComponentDef(name);
                    let val = node.data[name] as any;
                    if (componentDef.dataType === DataType.BYTES) {
                        val = new Uint8Array(await dataUrlToArrayBuffer(val));
                    }
                    if (componentDef.deserialize) {
                        val = componentDef.deserialize(val);
                    }
                    node.data[name] = val;
                }
                if (node.children) {
                    await convertJsonToRealDataType(node.children);
                }
                node.selected = false;
            }
        }

        await convertJsonToRealDataType(json);

        const model = ctx.model;
        let target: ModelNode | undefined = e instanceof ModelNode ? e : undefined;
        if (!target) {
            model.forEach(node => {
                if (model.selected.includes(node.id)) {
                    target = node;
                    return false;
                }
            });
        }

        function filterInvalidInstancedNodes(json: ModelNodeCreationInfo[]) {
            json = json.filter(nodeJson => {
                if (!nodeJson.instanceId) {
                    return true;
                }
                if (!model.isNodeExists(nodeJson.instanceId)) {
                    return false;
                }
                return nodeJson.type === nodeJson.type;
            });
            for (let nodeJson of json) {
                if (nodeJson.children) {
                    nodeJson.children = filterInvalidInstancedNodes(nodeJson.children);
                }
            }
            return json;
        }

        json = filterInvalidInstancedNodes(json);

        let changed = false;
        const history = ctx.history;
        for (let item of json) {
            item.selected = true;
            if (target) {
                if (target.isValidChild(item.type)) {
                    const creationInfo = {...item};
                    creationInfo.parentId = target.id;
                    history.createNode(creationInfo);
                    changed = true;
                }
            } else {
                const nodeDef = getModelNodeDef(item.type);
                if (nodeDef.canBeRoot) {
                    const creationInfo = {...item};
                    creationInfo.parentId = undefined;
                    history.createNode(creationInfo);
                    changed = true;
                }
            }
        }
        if (changed) {
            model.selected = [];
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
