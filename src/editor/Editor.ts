import {BufferGeometry, Euler, Matrix4, Mesh, Object3D, Quaternion, Scene, Vector3} from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter';
import {OBJExporter} from 'three/examples/jsm/exporters/OBJExporter';
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
import EditorContext from './EditorContext';
import CameraConfig from './model/CameraConfig';
import CColors from './model/components/CColors';
import CCredit from './model/components/CCredit';
import CFlipDirection from './model/components/CFlipDirection';
import CIkNode from './model/components/CIkNode';
import CIkNodeRotation from './model/components/CIkNodeRotation';
import CImportReadonlyGltf from './model/components/CImportReadonlyGltf';
import CName from './model/components/CName';
import CObject3D from './model/components/CObject3D';
import CPosition from './model/components/CPosition';
import CRotation from './model/components/CRotation';
import CScale from './model/components/CScale';
import CSdfDirty from './model/components/CSdfDirty';
import CVertices from './model/components/CVertices';
import {ModelNodeCreationInfo} from './model/ModelHistory';
import ModelNode, {ModelNodeJson} from './model/ModelNode';
import ModelNodeComponent from './model/ModelNodeComponent';
import {DataType, getModelNodeComponentDef} from './model/ModelNodeComponentDef';
import {getModelNodeDef, getValidChildNodeDefs, ModelNodeDef, modelNodeDefs} from './model/ModelNodeDef';
import ProjectReader from './ProjectReader';
import ProjectWriter from './ProjectWriter';
import EditorTool from './tools/EditorTool';
import {dataUrlToArrayBuffer} from './utils/convert';
import {voxelizeRemesh} from './utils/geometry/voxelize-remesh';
import {getAxisAngle, getTranslation} from './utils/math';
import {progressiveDownload} from './utils/progressive-download';
import {useSketchfabClient} from './utils/sketchfab';

const extension = '.doll';
const filePickerAcceptType: FilePickerAcceptType = {
    description: 'Model',
    accept: {'application/figure-doll-editor': [extension]}
};
const localStorageKey = 'figure-doll-editor-options';

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
                    localStorageKey,
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
                const optionsJson = localStorage.getItem(localStorageKey);
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
                const ctx = editorCtx.value!;
                ctx.statusBarMessage = 'Loading...';
                fullscreenLoading.value = true;
                await nextTick();
                const file = await fileHandle.getFile();
                filename.value = file.name;
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
                editorCtx.value!.statusBarMessage = 'Failed to import file.';
            } finally {
                fullscreenLoading.value = false;
            }
        }

        async function onExport(format: string) {
            function getExportScene() {
                const ctx = editorCtx.value!.readonlyRef();
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
                for (let node of ctx.model.nodes) {
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
                    editorCtx.value!.statusBarMessage = 'Exporting...';
                    fullscreenLoading.value = true;
                    await nextTick();
                    await callback(async function () {
                        editorCtx.value!.statusBarMessage = 'Writing files...';
                        await nextTick();
                    });
                    editorCtx.value!.statusBarMessage = 'File exported.';
                } catch (e) {
                    console.error(e);
                    editorCtx.value!.statusBarMessage = 'Failed to export.';
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
                    suggestedName: filename.value ? filename.value + extension : undefined
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
            let nodes = model.selected.map(id => model.getNode(id));
            const parent = (position === 'before' || position === 'after') ? related.parent : related;
            nodes = nodes.filter(node => {
                if (node.parent && nodes.includes(node.parent)) {
                    return false;
                }
                const def = getModelNodeDef(node.type);
                if (def.fixed) {
                    return false;
                }
                return true;
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
                    if (parent === node) {
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
            const targets = await onCopy(e);
            if (targets) {
                for (let node of targets) {
                    editorCtx.value!.history.removeNode(node.id);
                }
            }
            focus();
        }

        async function onCopy(e?: KeyboardEvent): Promise<ModelNode[] | void> {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            const targets = editorCtx.value!.model.getTopmostSelectedNodes();
            const clipboardContext: ModelNodeJson[] = [];
            for (let node of targets) {
                clipboardContext.push(await node.toJson());
            }
            await navigator.clipboard.writeText(JSON.stringify(clipboardContext));
            focus();
            return targets;
        }

        async function onPaste(e?: ModelNode | KeyboardEvent) {
            if (e && 'target' in e && (e.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            try {
                let json = JSON.parse(await navigator.clipboard.readText()) as ModelNodeCreationInfo[];
                if (!Array.isArray(json)) {
                    return;
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

                const model = editorCtx.value!.model;
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
                const history = editorCtx.value!.history;
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
                focus();
            } catch (e) {
                console.error(e);
                return;
            }
        }

        function onConvertToClay(node: ModelNode) {
            node = toRaw(node);
            const ctx = editorCtx.value!;
            const parent = node.parent;
            let verticesArr: Float32Array[] = [];
            let colorsArr: (Float32Array | null)[] = [];
            switch (node.type) {
                case 'Shape': {
                    const cSdfDirty = node.get(CSdfDirty);
                    if (cSdfDirty.throttleHash) {
                        const task = ctx.throttleTasks.get(cSdfDirty.throttleHash);
                        if (task) {
                            task.callback();
                            ctx.throttleTasks.delete(cSdfDirty.throttleHash);
                        }
                        cSdfDirty.throttleHash = '';
                    }
                    const mesh = node.value(CObject3D) as Mesh;
                    const geometry = mesh.geometry;
                    verticesArr = [new Float32Array(geometry.getAttribute('position').array)];
                    if (geometry.hasAttribute('color')) {
                        colorsArr = [new Float32Array(geometry.getAttribute('color').array)];
                    } else {
                        colorsArr = [null];
                    }
                }
                    break;
                default: {
                    if (!node.has(CObject3D)) {
                        return;
                    }
                    const mesh = node.value(CObject3D);
                    if (!mesh) {
                        return;
                    }
                    const geometries: BufferGeometry[] = [];
                    if ((mesh as Mesh).geometry) {
                        geometries.push((mesh as Mesh).geometry);
                    } else {
                        for (let child of mesh.children) {
                            if ((child as Mesh).geometry) {
                                geometries.push((child as Mesh).geometry);
                            }
                        }
                    }
                    const _a = new Vector3();
                    const _b = new Vector3();
                    const _c = new Vector3();
                    for (let geometry of geometries) {
                        if (!geometry.isBufferGeometry) {
                            continue;
                        }
                        const attrPos = geometry.getAttribute('position');
                        if (!attrPos) {
                            continue;
                        }
                        const index = geometry.index;
                        if (index) {
                            const vertices = new Float32Array(index.count * 3);
                            const colors = new Float32Array(index.count * 3);
                            for (let i = 0, len = index.count; i < len; i += 3) {
                                _a.fromBufferAttribute(attrPos, index.getX(i));
                                _b.fromBufferAttribute(attrPos, index.getX(i + 1));
                                _c.fromBufferAttribute(attrPos, index.getX(i + 2));
                                const j = i * 3;
                                vertices[j] = _a.x;
                                vertices[j + 1] = _a.y;
                                vertices[j + 2] = _a.z;
                                vertices[j + 3] = _b.x;
                                vertices[j + 4] = _b.y;
                                vertices[j + 5] = _b.z;
                                vertices[j + 6] = _c.x;
                                vertices[j + 7] = _c.y;
                                vertices[j + 8] = _c.z;
                            }
                            if (geometry.hasAttribute('color')) {
                                const attrColor = geometry.getAttribute('color');
                                for (let i = 0, len = index.count; i < len; i += 3) {
                                    _a.fromBufferAttribute(attrColor, index.getX(i));
                                    _b.fromBufferAttribute(attrColor, index.getX(i + 1));
                                    _c.fromBufferAttribute(attrColor, index.getX(i + 2));
                                    const j = i * 3;
                                    colors[j] = _a.x;
                                    colors[j + 1] = _a.y;
                                    colors[j + 2] = _a.z;
                                    colors[j + 3] = _b.x;
                                    colors[j + 4] = _b.y;
                                    colors[j + 5] = _b.z;
                                    colors[j + 6] = _c.x;
                                    colors[j + 7] = _c.y;
                                    colors[j + 8] = _c.z;
                                }
                            } else {
                                for (let i = 0, len = colors.length; i < len; ++i) {
                                    colors[i] = 1;
                                }
                            }
                            if (vertices.length) {
                                verticesArr.push(vertices);
                                colorsArr.push(colors);
                            }
                        } else {
                            if (attrPos.array.length) {
                                verticesArr.push(new Float32Array(attrPos.array));
                                if (geometry.hasAttribute('color')) {
                                    const attrColor = geometry.getAttribute('color');
                                    colorsArr.push(new Float32Array(attrColor.array));
                                } else {
                                    colorsArr.push(null);
                                }
                            }
                        }
                    }
                }
                    break;
            }
            if (!verticesArr.length) {
                return;
            }
            for (let i = 0, len = verticesArr.length; i < len; ++i) {
                const vertices = verticesArr[i];
                const colors = colorsArr[i];
                ctx.history.createNode({
                    type: 'Clay',
                    parentId: parent ? parent.id : 0,
                    data: {
                        [CName.name]: node.value(CName),
                        [CPosition.name]: node.cloneValue(CPosition),
                        [CRotation.name]: node.cloneValue(CRotation),
                        [CScale.name]: node.cloneValue(CScale),
                        [CVertices.name]: vertices,
                        [CColors.name]: colors || undefined,
                    }
                });
            }
            ctx.history.removeNode(node.id);
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
            const ctx = editorCtx.value!;
            node = toRaw(node);

            const baseMat = new Matrix4();
            const invBaseMat = new Matrix4();
            const flipDirWorld = new Vector3();
            const flipOriginWorld = new Vector3();
            if (mirror !== 'none') {
                baseMat.copy(node.getParentWorldMatrix());
                invBaseMat.copy(baseMat).invert();
                switch (mirror) {
                    case 'x':
                        flipDirWorld.set(1, 0, 0);
                        break;
                    case 'y':
                        flipDirWorld.set(0, 1, 0);
                        break;
                    case 'z':
                        flipDirWorld.set(0, 0, 1);
                        break;
                }
                flipDirWorld.transformDirection(baseMat);
                flipOriginWorld.applyMatrix4(baseMat);
            }

            const _localTranslation1 = new Vector3();
            const _localRotation1 = new Quaternion();
            const _localScale1 = new Vector3();
            const _localMat1 = new Matrix4();
            const _axis = new Vector3();
            const _ikNodeQuat = new Quaternion();

            function makeNewNode(
                node: ModelNode,
                parentMat0?: Matrix4,
                parentMat1?: Matrix4,
                invParentMat1?: Matrix4,
                prevInvQuat1?: Quaternion,
            ) {
                const newNode: ModelNodeCreationInfo = {
                    type: node.type,
                    instanceId: node.instanceId || node.id,
                };
                newNode.data = node.getComponentData(true);
                let invQuat1: Quaternion | undefined = undefined;
                if (mirror !== 'none') {
                    parentMat0 = parentMat0!;
                    parentMat1 = parentMat1!;
                    invParentMat1 = invParentMat1!;
                    newNode.data[CFlipDirection.name] = new Vector3().copy(flipDirWorld).transformDirection(invBaseMat);
                    _localTranslation1.set(0, 0, 0);
                    _localRotation1.set(0, 0, 0, 1);
                    _localScale1.set(1, 1, 1);
                    if (node.has(CPosition)) {
                        const position = newNode.data[CPosition.name] as Vector3;
                        position.applyMatrix4(parentMat0);
                        position.sub(flipOriginWorld);
                        position.reflect(flipDirWorld);
                        position.add(flipOriginWorld);
                        position.applyMatrix4(invParentMat1);
                        _localTranslation1.copy(position);
                    }
                    if (node.has(CRotation)) {
                        const rotation = newNode.data[CRotation.name] as Euler;
                        _localRotation1.setFromEuler(rotation);
                        const angle = getAxisAngle(_axis, _localRotation1);
                        _axis.applyMatrix4(parentMat0);
                        _axis.sub(flipOriginWorld);
                        _axis.reflect(flipDirWorld);
                        _axis.add(flipOriginWorld);
                        _axis.applyMatrix4(invParentMat1);
                        _axis.normalize();
                        _localRotation1.setFromAxisAngle(_axis, -angle);
                        rotation.setFromQuaternion(_localRotation1);
                    }
                    if (node.has(CIkNode)) {
                        if (mirror === 'x') {
                            throw new Error('Flipping on x axis will broke the ik chain');
                        }

                        const cIkNode = node.get(CIkNode);

                        _localTranslation1.copy(cIkNode.start);
                        _localTranslation1.applyMatrix4(parentMat0);
                        _localTranslation1.sub(flipOriginWorld);
                        _localTranslation1.reflect(flipDirWorld);
                        _localTranslation1.add(flipOriginWorld);
                        _localTranslation1.applyMatrix4(invParentMat1);

                        let angle = getAxisAngle(_axis, cIkNode.quaternion);
                        _axis.applyMatrix4(parentMat0);
                        _axis.sub(flipOriginWorld);
                        _axis.reflect(flipDirWorld);
                        _axis.add(flipOriginWorld);
                        _axis.applyMatrix4(invParentMat1);
                        _axis.normalize();
                        _localRotation1.setFromAxisAngle(_axis, -angle);

                        const ikNodeRotation = newNode.data[CIkNodeRotation.name] as Euler;
                        if (prevInvQuat1) {
                            _ikNodeQuat.multiplyQuaternions(prevInvQuat1, _localRotation1);
                            ikNodeRotation.setFromQuaternion(_ikNodeQuat);
                        } else {
                            ikNodeRotation.setFromQuaternion(_localRotation1);
                        }
                    }
                    if (node.has(CScale)) {
                        _localScale1.setScalar(node.value(CScale));
                    }
                    _localMat1.compose(_localTranslation1, _localRotation1, _localScale1);
                    parentMat1 = new Matrix4().multiplyMatrices(parentMat1, _localMat1);
                    invParentMat1 = new Matrix4().copy(parentMat1).invert();
                    parentMat0 = node.getWorldMatrix();
                    invQuat1 = new Quaternion().copy(_localRotation1).invert();
                }
                newNode.children = [];
                let prevChildInvQuat1: Quaternion | undefined = undefined;
                for (let child of node.children) {
                    const newChild = makeNewNode(child, parentMat0, parentMat1, invParentMat1, prevChildInvQuat1);
                    prevChildInvQuat1 = newChild.invQuat1;
                    newNode.children.push(newChild.creationInfo);
                }
                newNode.expanded = node.expanded;
                newNode.selected = false;
                return {creationInfo: newNode, invQuat1};
            }

            const create = makeNewNode(node, baseMat, baseMat, invBaseMat).creationInfo;
            create.parentId = node.parent?.id;
            create.selected = true;
            ctx.model.selected = [];
            ctx.history.createNode(create);
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
            onRemesh,
            onCreateInstance,
            onLoadCamera,
            onDeleteCamera,
            onSaveCamera,
            onSketchfabLogin,
            onSketchfabLogout,
            onSketchfabImportModel,
        };
    }
});
