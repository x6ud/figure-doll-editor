import {nextTick, Ref} from 'vue';
import {showAlertDialog} from '../dialogs/dialogs';
import EditorContext from '../EditorContext';
import CImage from '../model/components/CImage';
import CImportFbx from '../model/components/CImportFbx';
import CImportObj from '../model/components/CImportObj';
import CUsePlainMaterial from '../model/components/CUsePlainMaterial';
import {ModelNodeCreationInfo} from '../model/ModelHistory';
import ProjectReader from '../ProjectReader';
import {bufferToDataUrl} from '../utils/convert';

export async function importModel(
    ctx: EditorContext,
    fullscreenLoading: Ref<boolean>,
    modelType: FilePickerAcceptType,
    modelExtension: string,
) {
    let fileHandle: FileSystemFileHandle | null = null;
    const acceptTypes: FilePickerAcceptType[] = [
        modelType,
        {
            description: 'Wavefront',
            accept: {'application/object': ['.obj']}
        },
        {
            description: 'FBX',
            accept: {'application/fbx': ['.fbx']}
        },
        {
            description: 'Image',
            accept: {
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp'],
                'image/bmp': ['.bmp'],
                'image/webp': ['.webp'],
            }
        },
    ];
    try {
        [fileHandle] = await showOpenFilePicker({
            types: [
                {
                    description: 'All Supported',
                    accept: acceptTypes.reduce((obj, type) => Object.assign(obj, type.accept), {})
                },
                ...acceptTypes
            ],
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
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        switch (ext) {
            case modelExtension: {
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
            }
                break;
            case '.obj': {
                const text = await file.text();
                ctx.history.createNode({
                    type: 'ObjModel',
                    data: {
                        [CImportObj.name]: text,
                        [CUsePlainMaterial.name]: true,
                    }
                });
            }
                break;
            case '.fbx': {
                const buffer = await file.arrayBuffer();
                const dataUrl = await bufferToDataUrl(new Blob([buffer]));
                ctx.history.createNode({
                    type: 'FbxModel',
                    data: {
                        [CImportFbx.name]: dataUrl,
                        [CUsePlainMaterial.name]: true,
                    }
                });
            }
                break;
            case '.jpg':
            case '.jpeg':
            case '.jfif':
            case '.pjpeg':
            case '.pjp':
            case '.png':
            case '.apng':
            case '.gif':
            case '.avif':
            case '.webp':
            case '.bmp': {
                const buffer = await file.arrayBuffer();
                const dataUrl = await bufferToDataUrl(new Blob([buffer]));
                ctx.history.createNode({
                    type: 'Image',
                    data: {
                        [CImage.name]: dataUrl
                    }
                });
            }
                break;
            default: {
                await showAlertDialog(`Unsupported file format ${ext}`);
            }
        }
        focus();
        ctx.statusBarMessage = '';
    } catch (e) {
        console.error(e);
        ctx.statusBarMessage = 'Failed to import file: ' + e;
    } finally {
        fullscreenLoading.value = false;
    }
}
