import {Euler, Mesh, Vector3} from 'three';
import {computed, defineComponent, nextTick, onMounted, ref, toRaw, watch} from 'vue';
import {useRouter} from 'vue-router';
import Class from '../common/type/Class';
import RenderLoop from '../common/utils/RenderLoop';
import {createTransitionAnimation} from '../common/utils/transition';
import ColorPicker from './components/ColorPicker/ColorPicker.vue';
import FullscreenLoading from './components/FullscreenLoading/FullscreenLoading.vue';
import InputBoolean from './components/input/InputBoolean/InputBoolean.vue';
import InputNumber from './components/input/InputNumber/InputNumber.vue';
import LabelRange from './components/LabelRange/LabelRange.vue';
import ModelNodeProperties from './components/ModelNodeProperties/ModelNodeProperties.vue';
import ModelTree from './components/ModelTree/ModelTree.vue';
import PopupDialog from './components/popup/PopupDialog/PopupDialog.vue';
import PopupMenu from './components/popup/PopupMenu/PopupMenu.vue';
import PopupMenuItem from './components/popup/PopupMenu/PopupMenuItem.vue';
import QuadView from './components/QuadView/QuadView.vue';
import SidePanel from './components/SidePanel/SidePanel.vue';
import {showAlertDialog, showConfirmDialog} from './dialogs/dialogs';
import {copyModelSelected, cutModelSelected, pastedModelNodes} from './editor-functions/clipboard';
import {convertModelNodeToClay} from './editor-functions/convert-to-clay';
import {copyPose, pastePose} from './editor-functions/copy-pose';
import {createInstanceNode} from './editor-functions/create-instance-node';
import {exportModel} from './editor-functions/export-model';
import {flipNode} from './editor-functions/flip-node';
import {importModel} from './editor-functions/import-model';
import EditorContext from './EditorContext';
import CameraConfig from './model/CameraConfig';
import CColors from './model/components/CColors';
import CCredit from './model/components/CCredit';
import CImportReadonlyGltf from './model/components/CImportReadonlyGltf';
import CName from './model/components/CName';
import CObject3D from './model/components/CObject3D';
import CPosition from './model/components/CPosition';
import CRotation from './model/components/CRotation';
import CScale from './model/components/CScale';
import CVertices from './model/components/CVertices';
import ModelNode, {ModelNodeJson} from './model/ModelNode';
import ModelNodeComponent from './model/ModelNodeComponent';
import {getModelNodeDef, getValidChildNodeDefs, ModelNodeDef, modelNodeDefs} from './model/ModelNodeDef';
import ProjectReader from './ProjectReader';
import ProjectWriter from './ProjectWriter';
import EditorTool from './tools/EditorTool';
import {voxelizeRemesh} from './utils/geometry/voxelize-remesh';
import {getTranslation} from './utils/math';
import {progressiveDownload} from './utils/progressive-download';
import {useSketchfabClient} from './utils/sketchfab';

const extension = '.doll';
const filePickerAcceptType: FilePickerAcceptType = {
    description: 'Model',
    accept: {'application/figure-doll-editor': [extension]}
};
const optionsLocalStorageKey = 'figure-doll-editor-options';

export default defineComponent({
    components: {
        ColorPicker,
        FullscreenLoading,
        InputBoolean,
        InputNumber,
        LabelRange,
        ModelNodeProperties,
        ModelTree,
        PopupDialog,
        PopupMenu,
        PopupMenuItem,
        QuadView,
        SidePanel,
    },
    setup() {
        const router = useRouter();
        const sketchfabClient = useSketchfabClient();

        const dom = ref<HTMLElement>();
        const editorCtx = ref<EditorContext>();
        const renderLoop = new RenderLoop(function () {
            editorCtx.value?.update();
        });
        const uiOptions = ref({
            showTools: true,
            showModelTree: true,
            showProperties: true,
            showStatusBar: true,
            modelTreePanelWidth: 200,
            modelNodePropertiesPanelWidth: 200,
            colorPanelX: 250,
            colorPanelY: 50,
        });
        const fullscreenLoading = ref(false);

        const filename = ref<string | null>(null);
        let fileHandle: FileSystemFileHandle | null = null;

        // the adding new node menu list
        const validChildNodeDefs = computed<ModelNodeDef[]>(function () {
            const model = editorCtx.value?.model;
            if (!model) {
                return [];
            }
            if (model.selected.length === 0) {
                return modelNodeDefs.filter(def => {
                    if (!def.canBeRoot) {
                        return false;
                    }
                    if (!def.showInList) {
                        return false;
                    }
                    if (def.unique) {
                        return !model.nodes.find(node => node.type === def.name);
                    }
                    return true;
                });
            }
            if (model.selected.length > 1) {
                return [];
            }
            return getValidChildNodeDefs(model.getSelectedNodes()[0]).filter(def => def.showInList);
        });

        const canDelete = computed(function () {
            const model = editorCtx.value?.model;
            if (!model) {
                return false;
            }
            return model.getSelectedNodes().filter(node => {
                const def = getModelNodeDef(node.type);
                return !def.fixed;
            }).length;
        });

        // update page title
        watch([filename, () => editorCtx.value?.history?.dirty],
            function ([filename, dirty]) {
                if (filename && filename.endsWith(extension)) {
                    filename = filename.substring(0, filename.length - extension.length);
                }
                document.title = (filename || 'Untitled') + (dirty ? '*' : '') + ' - Figure Doll Editor';
            },
            {immediate: true}
        );

        // auto save options
        watch([
                uiOptions,
                () => editorCtx.value?.options
            ],
            function () {
                localStorage.setItem(
                    optionsLocalStorageKey,
                    JSON.stringify({
                        ui: uiOptions.value,
                        options: editorCtx.value?.options
                    })
                );
            },
            {
                deep: true
            });

        // check browser compatibility
        onMounted(async function () {
            if (!('showOpenFilePicker' in window)) {
                await showAlertDialog('This application is only available in Chrome or Edge.\nCannot open or save files in the current browser.');
            }
            sketchfabClient.parseRouterPath(router.currentRoute.value.fullPath);
            if (router.currentRoute.value.fullPath.length > 1) {
                await router.push('/');
            }
        });

        function focus() {
            dom.value?.focus();
        }

        function onCanvasMounted(
            canvas: HTMLCanvasElement,
            view1: HTMLElement,
            view2: HTMLElement,
            view3: HTMLElement,
            view4: HTMLElement,
        ) {
            editorCtx.value = new EditorContext(canvas, view1, view2, view3, view4);
            // load saved options
            try {
                const optionsJson = localStorage.getItem(optionsLocalStorageKey);
                if (optionsJson) {
                    const options = JSON.parse(optionsJson);
                    if ('ui' in options) {
                        Object.assign(uiOptions.value, options.ui);
                    }
                    if ('options' in options) {
                        Object.assign(editorCtx.value.options, options.options);
                        for (let name in editorCtx.value.options.tools) {
                            const toolOptions = editorCtx.value.options.tools[name];
                            const tool = editorCtx.value.tools.find(tool => tool.constructor.name === name);
                            if (tool) {
                                for (let prop in toolOptions) {
                                    (tool[prop as keyof EditorTool] as any) = toolOptions[prop];
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
            renderLoop.start();
            (window as any).ctx = editorCtx.value!.readonlyRef();
        }

        function onBeforeCanvasUnmount() {
            editorCtx.value?.dispose();
            editorCtx.value = undefined;
        }

        function onUndo(e?: KeyboardEvent | MouseEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            editorCtx.value!.history.undo();
            focus();
        }

        function onRedo(e?: KeyboardEvent | MouseEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            editorCtx.value!.history.redo();
            focus();
        }

        async function historyConfirm() {
            if (editorCtx.value!.history.dirty) {
                return await showConfirmDialog('Unsaved changes will be lost.\nAre you sure you want to continue?');
            }
            return true;
        }

        async function onNew() {
            if (await historyConfirm()) {
                filename.value = null;
                fileHandle = null;
                editorCtx.value!.reset();
                focus();
                editorCtx.value!.statusBarMessage = '';
            }
        }

        async function onOpen() {
            try {
                [fileHandle] = await showOpenFilePicker({
                    types: [filePickerAcceptType],
                    multiple: false
                });
            } catch (e) {
                return;
            }
            if (await historyConfirm()) {
                try {
                    editorCtx.value!.statusBarMessage = 'Loading...';
                    fullscreenLoading.value = true;
                    await nextTick();
                    const file = await fileHandle.getFile();
                    filename.value = file.name;
                    const data = new ProjectReader(new Uint8Array(await file.arrayBuffer())).read();
                    editorCtx.value!.load(data);
                    focus();
                    editorCtx.value!.statusBarMessage = '';
                } catch (e) {
                    console.error(e);
                    editorCtx.value!.statusBarMessage = 'Failed to open file.';
                } finally {
                    fullscreenLoading.value = false;
                }
            }
        }

        async function onImport() {
            await importModel(editorCtx.value!, fullscreenLoading, filePickerAcceptType);
        }

        async function onExport(format: string) {
            await exportModel(editorCtx.value!, fullscreenLoading, format);
        }

        async function onSave(e?: KeyboardEvent | MouseEvent) {
            if (e?.shiftKey) {
                await onSaveAs();
            } else {
                if (fileHandle) {
                    await saveFile();
                } else {
                    await onSaveAs();
                }
                focus();
            }
        }

        async function onSaveAs() {
            try {
                fileHandle = await showSaveFilePicker({
                    types: [filePickerAcceptType],
                    suggestedName: filename.value || undefined
                });
            } catch (e) {
                return;
            }
            const file = await fileHandle.getFile();
            filename.value = file.name;
            await saveFile();
            focus();
        }

        async function saveFile() {
            if (!fileHandle) {
                return;
            }
            try {
                editorCtx.value!.statusBarMessage = 'Saving...';
                fullscreenLoading.value = true;
                await nextTick();
                const stream = await fileHandle.createWritable({keepExistingData: false});
                const bytes = new ProjectWriter().write(editorCtx.value!).getBytes();
                editorCtx.value!.statusBarMessage = 'Writing files...';
                await nextTick();
                await stream.write(bytes);
                await stream.close();
                editorCtx.value!.history.save();
                editorCtx.value!.statusBarMessage = 'File saved.';
            } catch (e) {
                editorCtx.value!.statusBarMessage = 'Failed to save file.';
            } finally {
                fullscreenLoading.value = false;
            }
        }

        function onSetView(face: string) {
            const ctx = editorCtx.value!;
            const view = ctx.views[ctx.mainViewIndex];
            const camera = view.camera;
            let alpha = camera.alpha;
            let beta = camera.beta;
            switch (face) {
                case 'front':
                    alpha = 0;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = +Math.PI / 2;
                    }
                    break;
                case 'back':
                    alpha = 0;
                    beta = +Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'top':
                    alpha = -Math.PI / 2;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = +Math.PI / 2;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'bottom':
                    alpha = +Math.PI / 2;
                    beta = -Math.PI / 2;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = -Math.PI / 2;
                        beta = -Math.PI / 2;
                    }
                    break;
                case 'right':
                    alpha = 0;
                    beta = 0;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = Math.PI;
                    }
                    break;
                case 'left':
                    alpha = 0;
                    beta = Math.PI;
                    if (Math.abs(alpha - camera.alpha) < 1e-8 && Math.abs(beta - camera.beta) < 1e-8) {
                        alpha = 0;
                        beta = 0;
                    }
                    break;
            }
            const da = alpha - camera.alpha;
            const db = beta - camera.beta;
            createTransitionAnimation(function (t) {
                camera.alpha = alpha - da * (1 - t);
                camera.beta = beta - db * (1 - t);
            }, 100);
        }

        function onSetValue(node: ModelNode, componentClass: Class<ModelNodeComponent<any>>, value: any) {
            editorCtx.value!.history.setValue(node, componentClass, value);
        }

        function onMoveNode(related: ModelNode, position: 'before' | 'after' | 'atFirst' | 'atLast') {
            related = toRaw(related);
            const ctx = editorCtx.value!;
            const model = toRaw(ctx.model);
            let nodes = model.getSelectedNodes();
            const parent = (position === 'before' || position === 'after') ? related.parent : related;
            nodes = nodes.filter(node => {
                let expanded = true;
                let parent = node.parent;
                while (expanded) {
                    if (!parent) {
                        break;
                    }
                    if (!parent.expanded) {
                        expanded = false;
                        break;
                    }
                    parent = parent.parent;
                }
                if (!expanded) {
                    return false;
                }
                if (node.parent && nodes.includes(node.parent)) {
                    return false;
                }
                const def = getModelNodeDef(node.type);
                return !def.fixed;

            });
            for (let node of nodes) {
                if (!isValidChild(parent, node)) {
                    return;
                }
            }
            for (let node of nodes) {
                const keepTransformUnchanged = ctx.options.keepTransformUnchangedWhileMoving;
                if (position === 'before' || position === 'after') {
                    ctx.history.moveNode(node, parent, related, position === 'after', keepTransformUnchanged);
                } else {
                    ctx.history.moveNode(node, parent, null, position === 'atLast', keepTransformUnchanged);
                }
            }

            function isValidChild(parent: ModelNode | null, node: ModelNode) {
                const nodeDef = getModelNodeDef(node.type);
                if (!parent) {
                    return nodeDef.canBeRoot;
                }
                if (!parent.isValidChild(node.type)) {
                    return false;
                }
                for (; parent; parent = parent.parent) {
                    if (parent.id === node.id) {
                        return false;
                    }
                }
                return true;
            }
        }

        function onAddNode(type: string) {
            const model = editorCtx.value!.model;
            const parentId = model.selected[0];
            model.selected = [];
            const json: ModelNodeJson = {
                type,
                parentId,
            };
            const def = getModelNodeDef(type);
            if (def.defaultData) {
                json.data = def.defaultData;
            }
            if (def.defaultChildren) {
                json.children = def.defaultChildren;
            }
            editorCtx.value!.history.createNode(json);
            focus();
        }

        function onDelete(e?: KeyboardEvent) {
            if (e?.key === 'Backspace') {
                return;
            }
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            if (!editorCtx.value!.tool.enableDefaultDeleteShortcut
                && e?.key === 'Delete'
            ) {
                return;
            }
            const model = editorCtx.value!.model;
            const targets = model.getTopmostSelectedNodes();
            for (let node of targets) {
                const def = getModelNodeDef(node.type);
                if (!def.fixed) {
                    editorCtx.value!.history.removeNode(node.id);
                }
            }
            focus();
        }

        function onSelect(ids: number[]) {
            editorCtx.value!.nextFrameEnd(function () {
                editorCtx.value!.model.selected = ids;
            });
        }

        function onSetNodesProperties(items: { node: ModelNode, type: Class<ModelNodeComponent<any>>, value: any }[]) {
            for (let item of items) {
                editorCtx.value!.history.setValue(item.node, item.type, item.value);
            }
        }

        function onFocus(node?: ModelNode) {
            if (!node) {
                return;
            }
            const position = new Vector3();
            getTranslation(position, node.getWorldMatrix());
            if (node.has(CObject3D)) {
                const obj = node.value(CObject3D) as Mesh;
                if (obj) {
                    const geometry = obj.geometry;
                    if (geometry) {
                        if (!geometry.boundingSphere) {
                            geometry.computeBoundingSphere();
                        }
                        position.copy(geometry.boundingSphere!.center);
                        position.applyMatrix4(node.getWorldMatrix());
                    }
                }
            }
            for (let view of editorCtx.value!.views) {
                view.camera.target.copy(position);
            }
        }

        async function onCut(e?: KeyboardEvent) {
            if (await cutModelSelected(editorCtx.value!, e)) {
                focus();
            }
        }

        async function onCopy(e?: KeyboardEvent): Promise<ModelNode[] | void> {
            if (await copyModelSelected(editorCtx.value!, e)) {
                focus();
            }
        }

        async function onPaste(e?: ModelNode | KeyboardEvent) {
            if (await pastedModelNodes(editorCtx.value!, e)) {
                focus();
            }
        }

        function onConvertToClay(node: ModelNode) {
            convertModelNodeToClay(editorCtx.value!, node);
        }

        function onApplyTransformation(node: ModelNode) {
            node = toRaw(node);
            const ctx = editorCtx.value!;
            const mat = node.getLocalMatrix();
            const vertices = node.cloneValue(CVertices);
            const vertex = new Vector3();
            for (let i = 0, len = vertices.length; i < len; i += 3) {
                vertex.fromArray(vertices, i);
                vertex.applyMatrix4(mat);
                vertices[i] = vertex.x;
                vertices[i + 1] = vertex.y;
                vertices[i + 2] = vertex.z;
            }
            ctx.history.setValue(node, CVertices, vertices);
            ctx.history.setValue(node, CPosition, new Vector3());
            ctx.history.setValue(node, CRotation, new Euler());
            ctx.history.setValue(node, CScale, 1);
        }

        const canRemesh = computed(function () {
            const ctx = editorCtx.value;
            if (!ctx) {
                return false;
            }
            const nodeId = ctx.model.selected[0];
            if (!nodeId) {
                return false;
            }
            return ctx.model.getNode(nodeId).type === 'Clay';
        });

        async function onRemesh() {
            const ctx = editorCtx.value?.readonlyRef();
            if (!ctx) {
                return;
            }
            const nodeId = ctx.model.selected[0];
            if (!nodeId) {
                return;
            }
            const node = ctx.model.getNode(nodeId);
            const cObject3D = node.get(CObject3D);
            const mesh = cObject3D.mesh;
            if (!mesh) {
                return;
            }
            try {
                fullscreenLoading.value = true;
                await nextTick();
                await new Promise(function (resolve) {
                    setTimeout(resolve, 50);
                }); // make sure loading shows up
                const vertices = voxelizeRemesh(
                    mesh.aPosition,
                    mesh.aColor,
                    mesh.triBox,
                    mesh.octree.box,
                    ctx.options.remeshVoxelSize
                );
                ctx.history.enableMerge = false;
                ctx.history.setValue(node, CVertices, vertices.position, 'remesh-position');
                ctx.history.setValue(node, CColors, vertices.color, 'remesh-color');
            } finally {
                fullscreenLoading.value = false;
            }
        }

        function onCreateInstance(node: ModelNode, mirror: 'none' | 'x' | 'y' | 'z') {
            createInstanceNode(editorCtx.value!, node, mirror);
        }

        function onFlip(node: ModelNode, mode: 'flip' | 'left-to-right' | 'right-to-left') {
            flipNode(editorCtx.value!, node, mode);
        }

        function onCopyPose(node: ModelNode) {
            return copyPose(node);
        }

        function onPastePose(node: ModelNode) {
            return pastePose(editorCtx.value!, node);
        }

        function onLoadCamera(camera: CameraConfig) {
            const ctx = editorCtx.value!;
            const model = ctx.model;
            const view = ctx.views[ctx.mainViewIndex];
            view.zoomLevel = camera.zoomLevel;
            view.camera.alpha = camera.alpha;
            view.camera.beta = camera.beta;
            view.camera.target.set(camera.target[0], camera.target[1], camera.target[2]);
            model.cameraPerspective = camera.perspective;
            model.cameraFov = camera.fov;
        }

        function onDeleteCamera(i: number) {
            editorCtx.value!.model.cameras.splice(i, 1);
            editorCtx.value!.history.dirty = true;
        }

        function onSaveCamera() {
            const ctx = editorCtx.value!;
            const model = ctx.model;
            const view = ctx.views[ctx.mainViewIndex];
            model.cameras.push({
                name: new Date().toISOString()
                    .replace('T', ' ')
                    .replace(/\.[0-9]+Z/, ''),
                zoomLevel: view.zoomLevel,
                alpha: view.camera.alpha,
                beta: view.camera.beta,
                target: [view.camera.target.x, view.camera.target.y, view.camera.target.z],
                perspective: model.cameraPerspective,
                fov: model.cameraFov,
            });
            ctx.history.dirty = true;
        }

        const sketchfabModelUrl = ref('');

        async function onSketchfabLogin() {
            if (await historyConfirm()) {
                sketchfabClient.login();
            }
        }

        function onSketchfabLogout() {
            sketchfabClient.logout();
        }

        const downloadProgressDialog = ref(false);
        const downloadProgressText = ref('');
        const downloadTotalText = ref('');
        const downloadCancelFlag = ref(false);
        const downloadProgressPercent = ref(0);

        async function onSketchfabImportModel() {
            if (!sketchfabModelUrl.value) {
                return;
            }
            try {
                editorCtx.value!.statusBarMessage = 'Fetching model download url...';
                fullscreenLoading.value = true;
                const {info, download} = (await sketchfabClient.getModelDownloadUrl(sketchfabModelUrl.value))!;
                if (download.gltf?.url) {
                    sketchfabModelUrl.value = '';
                    editorCtx.value!.statusBarMessage = 'Downloading model...';
                    fullscreenLoading.value = false;
                    downloadProgressDialog.value = true;
                    downloadCancelFlag.value = false;
                    downloadProgressPercent.value = 0;
                    downloadProgressText.value = '0.0MB';
                    downloadTotalText.value = (download.gltf.size / 1024 / 1024).toFixed(1) + 'MB';
                    const bytes = await progressiveDownload(
                        download.gltf.url,
                        (received, total) => {
                            downloadProgressPercent.value = Math.round(received / total * 100);
                            downloadProgressText.value = (received / 1024 / 1024).toFixed(1) + 'MB';
                        },
                        downloadCancelFlag,
                        download.gltf.size
                    );
                    if (!bytes) {
                        editorCtx.value!.statusBarMessage = 'Download canceled.';
                        return;
                    }
                    editorCtx.value!.history.createNode({
                        type: 'ImportModel',
                        data: {
                            [CName.name]: info.name,
                            [CCredit.name]: info,
                            [CImportReadonlyGltf.name]: bytes,
                        }
                    });
                    editorCtx.value!.statusBarMessage = 'Model imported.';
                } else {
                    editorCtx.value!.statusBarMessage = 'Failed to download model.';
                    if (download.detail) {
                        await showAlertDialog('Could not download model: ' + download.detail);
                    } else {
                        await showAlertDialog('Failed to get model download url.');
                    }
                }
            } catch (e) {
                editorCtx.value!.statusBarMessage = 'Failed to import model.';
            } finally {
                fullscreenLoading.value = false;
                downloadProgressDialog.value = false;
            }
        }

        function onOpenTutorial() {
            window.open('https://github.com/x6ud/figure-doll-editor#download-models');
        }

        return {
            dom,
            sketchfabClient,
            editorCtx,
            fullscreenLoading,
            uiOptions,
            validChildNodeDefs,
            canDelete,
            canRemesh,
            sketchfabModelUrl,
            downloadProgressDialog,
            downloadProgressText,
            downloadTotalText,
            downloadCancelFlag,
            downloadProgressPercent,
            onCanvasMounted,
            onBeforeCanvasUnmount,
            onUndo,
            onRedo,
            onNew,
            onOpen,
            onImport,
            onExport,
            onSave,
            onSaveAs,
            onSetView,
            onSetValue,
            onMoveNode,
            onAddNode,
            onDelete,
            onSelect,
            onSetNodesProperties,
            onFocus,
            onCut,
            onCopy,
            onPaste,
            onConvertToClay,
            onApplyTransformation,
            onRemesh,
            onCreateInstance,
            onFlip,
            onCopyPose,
            onPastePose,
            onLoadCamera,
            onDeleteCamera,
            onSaveCamera,
            onSketchfabLogin,
            onSketchfabLogout,
            onSketchfabImportModel,
            onOpenTutorial,
        };
    }
});
