import {nextTick, Ref} from 'vue';
import EditorContext from '../EditorContext';
import {ModelNodeCreationInfo} from '../model/ModelHistory';
import ProjectReader from '../ProjectReader';

export async function importModel(
    ctx: EditorContext,
    fullscreenLoading: Ref<boolean>,
    filePickerAcceptType: FilePickerAcceptType,
) {
    let fileHandle: FileSystemFileHandle | null = null;
    try {
        [fileHandle] = await showOpenFilePicker({
            types: [filePickerAcceptType],
            multiple: false
        });
    } catch (e) {
        return;
    }
    try {
        ctx.statusBarMessage = 'Loading...';
        fullscreenLoading.value = true;
        await nextTick();
        const file = await fileHandle.getFile();
        const data = new ProjectReader(new Uint8Array(await file.arrayBuffer())).read();
        const idMap: { [id: number]: number } = {};
        let nextId = ctx.history.getNextNodeId() + 1;
        for (let node of data.nodes) {
            idMap[node.id] = nextId++;
        }
        const creationInfoMap: { [id: number]: ModelNodeCreationInfo & { originId: number } } = {};
        for (let node of data.nodes) {
            creationInfoMap[node.id] = {
                originId: node.id,
                type: node.type,
                data: node.data,
                expanded: node.expanded,
                instanceId: node.instanceId ? idMap[node.instanceId] : 0
            };
        }
        const creationInfo: (ModelNodeCreationInfo & { originId: number })[] = [];
        for (let node of data.nodes) {
            if (node.parentId) {
                const parent = creationInfoMap[node.parentId];
                parent.children = parent.children || [];
                parent.children.push(creationInfoMap[node.id]);
            } else {
                creationInfo.push(creationInfoMap[node.id]);
            }
        }
        for (let node of creationInfo) {
            ctx.history.createNode(node);
        }
        focus();
        ctx.statusBarMessage = '';
    } catch (e) {
        console.error(e);
        ctx.statusBarMessage = 'Failed to import file.';
    } finally {
        fullscreenLoading.value = false;
    }
}
