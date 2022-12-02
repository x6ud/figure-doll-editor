import {DirectionalLight, Quaternion, Vector3} from 'three';
import {computed, defineComponent, nextTick, onMounted, ref, toRaw, watch} from 'vue';
import Class from '../common/type/Class';
import RenderLoop from '../common/utils/RenderLoop';
import {createTransitionAnimation} from '../common/utils/transition';
import {hideFullscreenLoading, showFullscreenLoading} from './components/FullscreenLoading/loading';
import ModelNodeProperties from './components/ModelNodeProperties/ModelNodeProperties.vue';
import ModelTree from './components/ModelTree/ModelTree.vue';
import PopupMenu from './components/popup/PopupMenu/PopupMenu.vue';
import PopupMenuItem from './components/popup/PopupMenu/PopupMenuItem.vue';
import QuadView from './components/QuadView/QuadView.vue';
import SidePanel from './components/SidePanel/SidePanel.vue';
import {showAlertDialog, showConfirmDialog} from './dialogs/dialogs';
import EditorContext from './EditorContext';
import ModelNode, {ModelNodeJson} from './model/ModelNode';
import ModelNodeComponent from './model/ModelNodeComponent';
import {getModelNodeDef, getValidChildNodeDefs, ModelNodeDef, modelNodeDefs} from './model/ModelNodeDef';
import ProjectReader from './ProjectReader';
import ProjectWriter from './ProjectWriter';

const extension = '.model';
const filePickerAcceptType: FilePickerAcceptType = {
    description: 'Model',
    accept: {'application/puppet-editor': [extension]}
};

export default defineComponent({
    components: {
        ModelNodeProperties,
        ModelTree,
        PopupMenu,
        PopupMenuItem,
        QuadView,
        SidePanel,
    },
    setup() {
        const dom = ref<HTMLElement>();
        const editorContext = ref<EditorContext>();
        const renderLoop = new RenderLoop(function () {
            editorContext.value?.update();
        });

        const modelTreePanelWidth = ref(200);
        const modelNodePropertiesPanelWidth = ref(200);

        const filename = ref<string | null>(null);
        let fileHandle: FileSystemFileHandle | null = null;

        const validChildNodeDefs = computed<ModelNodeDef[]>(function () {
            const model = editorContext.value?.model;
            if (!model) {
                return [];
            }
            if (model.selected.length === 0) {
                return modelNodeDefs.filter(def => def.canBeRoot);
            }
            if (model.selected.length > 1) {
                return [];
            }
            return getValidChildNodeDefs(model.getSelectedNodes()[0]);
        });

        watch([filename, () => editorContext.value?.history?.dirty],
            function ([filename, dirty]) {
                if (filename && filename.endsWith(extension)) {
                    filename = filename.substring(0, filename.length - extension.length);
                }
                document.title = (filename || 'Untitled') + (dirty ? '*' : '') + ' - Puppet Editor';
            },
            {immediate: true}
        );

        function focus() {
            dom.value?.focus();
        }

        onMounted(async function () {
            if (!('showOpenFilePicker' in window)) {
                await showAlertDialog('This application is only available in Chrome or Edge.\nCannot open or save files in the current browser.');
            }
        });

        function onCanvasMounted(
            canvas: HTMLCanvasElement,
            view1: HTMLElement,
            view2: HTMLElement,
            view3: HTMLElement,
            view4: HTMLElement,
        ) {
            editorContext.value = new EditorContext(canvas, view1, view2, view3, view4);
            renderLoop.start();

            const light = new DirectionalLight(0xffffff, 1.0);
            light.position.x = 0.5;
            light.position.z = 5;
            editorContext.value.scene.add(light);

            (window as any).ctx = editorContext.value!;
        }

        function onBeforeCanvasUnmount() {
            editorContext.value?.dispose();
            editorContext.value = undefined;
        }

        function onUndo(e?: KeyboardEvent | MouseEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            editorContext.value!.history.undo();
            focus();
        }

        function onRedo(e?: KeyboardEvent | MouseEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            editorContext.value!.history.redo();
            focus();
        }

        async function historyConfirm() {
            if (editorContext.value!.history.dirty) {
                return await showConfirmDialog('Unsaved changes will be lost.\nAre you sure you want to continue?');
            }
            return true;
        }

        async function onNew() {
            if (await historyConfirm()) {
                filename.value = null;
                fileHandle = null;
                editorContext.value!.reset();
                focus();
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
                    showFullscreenLoading();
                    await nextTick();
                    const file = await fileHandle.getFile();
                    filename.value = file.name;
                    const data = new ProjectReader(new Uint8Array(await file.arrayBuffer())).read();
                    editorContext.value!.load(data);
                    focus();
                } finally {
                    hideFullscreenLoading();
                }
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
                showFullscreenLoading();
                await nextTick();
                const stream = await fileHandle.createWritable({keepExistingData: false});
                await stream.write(new ProjectWriter().write(editorContext.value!).getBytes());
                await stream.close();
                editorContext.value!.history.save();
            } finally {
                hideFullscreenLoading();
            }
        }

        function onSetView(face: string) {
            const ctx = editorContext.value!;
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
            editorContext.value!.history.setValue(node, componentClass, value);
        }

        function onMoveNode(related: ModelNode, position: 'before' | 'after' | 'atFirst' | 'atLast') {
            related = toRaw(related);
            const ctx = editorContext.value!;
            const model = toRaw(ctx.model);
            let nodes = model.selected.map(id => model.getNode(id));
            const parent = (position === 'before' || position === 'after') ? related.parent : related;
            nodes = nodes.filter(node => !(node.parent && nodes.includes(node.parent)));
            for (let node of nodes) {
                if (!isValidChild(parent, node)) {
                    return;
                }
            }
            for (let node of nodes) {
                const keepTransformUnchanged = ctx.keepTransformUnchangedWhileMoving;
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
                const parentNodeDef = getModelNodeDef(parent.type);
                if (!parentNodeDef.validChildTypes.includes(node.type)) {
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
            const model = editorContext.value!.model;
            const parentId = model.selected[0];
            model.selected = [];
            editorContext.value!.history.createNode({
                type,
                parentId,
            });
            focus();
        }

        function onDelete(e?: KeyboardEvent) {
            if (e?.key === 'Backspace') {
                return;
            }
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            const model = editorContext.value!.model;
            const targets = model.getTopmostSelectedNodes();
            for (let node of targets) {
                editorContext.value!.history.removeNode(node.id);
            }
            focus();
        }

        function onSelect(ids: number[]) {
            editorContext.value!.nextFrameEnd(function () {
                editorContext.value!.model.selected = ids;
            });
        }

        function onSetNodeProperty(items: { node: ModelNode, type: Class<ModelNodeComponent<any>>, value: any }[]) {
            for (let item of items) {
                editorContext.value!.history.setValue(item.node, item.type, item.value);
            }
            focus();
        }

        function onFocus(node?: ModelNode) {
            if (!node) {
                return;
            }
            const position = new Vector3();
            const rotation = new Quaternion();
            const scale = new Vector3();
            node.getWorldMatrix().decompose(position, rotation, scale);
            for (let view of editorContext.value!.views) {
                view.camera.target.copy(position);
            }
        }

        let clipboardContent: ModelNodeJson[] = [];

        function onCut(e?: KeyboardEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            const targets = editorContext.value!.model.getTopmostSelectedNodes();
            clipboardContent = targets.map(node => node.toJson());
            for (let node of targets) {
                editorContext.value!.history.removeNode(node.id);
            }
            focus();
        }

        function onCopy(e?: KeyboardEvent) {
            if ((e?.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            const targets = editorContext.value!.model.getTopmostSelectedNodes();
            clipboardContent = targets.map(node => node.toJson());
            focus();
        }

        function onPaste(e?: ModelNode | KeyboardEvent) {
            if (!clipboardContent.length) {
                return;
            }
            if (e && 'target' in e && (e.target as (HTMLElement | undefined))?.tagName === 'INPUT') {
                return;
            }
            let target: ModelNode | undefined = e instanceof ModelNode ? e : undefined;
            const model = editorContext.value!.model;
            if (!target) {
                model.forEach(node => {
                    if (model.selected.includes(node.id)) {
                        target = node;
                        return false;
                    }
                });
            }
            let changed = false;
            const history = editorContext.value!.history;
            for (let item of clipboardContent) {
                if (target) {
                    if (getModelNodeDef(target.type).validChildTypes.includes(item.type)) {
                        const json = {...item};
                        json.parentId = target.id;
                        history.createNode(json);
                        changed = true;
                    }
                } else {
                    const nodeDef = getModelNodeDef(item.type);
                    if (nodeDef.canBeRoot) {
                        const json = {...item};
                        json.parentId = undefined;
                        history.createNode(json);
                        changed = true;
                    }
                }
            }
            if (changed) {
                model.selected = [];
            }
            focus();
        }

        return {
            dom,
            editorContext,
            modelTreePanelWidth,
            modelNodePropertiesPanelWidth,
            validChildNodeDefs,
            onCanvasMounted,
            onBeforeCanvasUnmount,
            onUndo,
            onRedo,
            onNew,
            onOpen,
            onSave,
            onSaveAs,
            onSetView,
            onSetValue,
            onMoveNode,
            onAddNode,
            onDelete,
            onSelect,
            onSetNodeProperty,
            onFocus,
            onCut,
            onCopy,
            onPaste,
        };
    }
});
