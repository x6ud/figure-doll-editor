import {Object3D, Scene} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter';
import {nextTick, Ref} from 'vue';
import EditorContext from '../EditorContext';
import CObject3D from '../model/components/CObject3D';

export async function exportModel(
    ctx: EditorContext,
    fullscreenLoading: Ref<boolean>,
    format: string
) {
    function getExportScene() {
        const scene = new Scene();
        scene.traverse = function (callback) {
            traverseVisible(scene);

            function traverseVisible(obj: Object3D) {
                for (let child of obj.children) {
                    if (child.visible) {
                        callback(child);
                        traverseVisible(child);
                    }
                }
            }
        };
        for (let node of ctx.readonlyRef().model.nodes) {
            if (node.has(CObject3D)) {
                const obj = node.value(CObject3D);
                if (obj) {
                    scene.children.push(obj);
                }
            }
        }
        return scene;
    }

    async function process(callback: (startWriting: () => Promise<void>) => Promise<void>) {
        try {
            ctx.statusBarMessage = 'Exporting...';
            fullscreenLoading.value = true;
            await nextTick();
            await callback(async function () {
                ctx.statusBarMessage = 'Writing files...';
                await nextTick();
            });
            ctx.statusBarMessage = 'File exported.';
        } catch (e) {
            console.error(e);
            ctx.statusBarMessage = 'Failed to export.';
        } finally {
            fullscreenLoading.value = false;
        }
    }

    switch (format) {
        case 'obj': {
            try {
                const fileHandle = await showSaveFilePicker({
                    types: [{
                        accept: {'application/object': ['.obj']}
                    }]
                });
                await process(async function (startWriting) {
                    const scene = getExportScene();
                    const str = new OBJExporter().parse(scene);
                    await startWriting();
                    const stream = await fileHandle.createWritable({keepExistingData: false});
                    await stream.write(str);
                    await stream.close();
                });
            } catch (e) {
                return;
            }
        }
            break;
        case 'glb': {
            try {
                const fileHandle = await showSaveFilePicker({
                    types: [{
                        accept: {'application/object': ['.glb']}
                    }]
                });
                await process(async function (startWriting) {
                    const scene = getExportScene();
                    const exporter = new GLTFExporter();
                    const buffer = await exporter.parseAsync(scene, {
                        onlyVisible: true, binary: true
                    }) as ArrayBuffer;
                    await startWriting();
                    const stream = await fileHandle.createWritable({keepExistingData: false});
                    await stream.write(buffer);
                    await stream.close();
                });
            } catch (e) {
                return;
            }
        }
            break;
        default:
            return;
    }
}
