import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CTube, {TubeNodePickerUserData} from '../model/components/CTube';
import ModelNode from '../model/ModelNode';
import EditorTool from './EditorTool';
import icon from './Tube.png';

export default class TubeTool extends EditorTool {
    label = 'Tube';
    icon = icon;
    enableDefaultDeleteShortcut = false;
    enableDefaultSelectionBehavior = false;

    private nodes: ModelNode[] = [];
    private enableDeleteThisFrame = true;

    begin(ctx: EditorContext) {
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            if (!ctx.model.selected.includes(node.id)) {
                cTube.selected.length = 0;
            }
        }
        this.enableDefaultDeleteShortcut = true;
        this.enableDeleteThisFrame = true;
        this.nodes = ctx.model.getSelectedNodes().filter(node => node.has(CTube));
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = true;
            }
            cTube.hovered = -1;
            if (cTube.selected.length) {
                this.enableDefaultDeleteShortcut = false;
            }
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        if (input.isKeyPressed('Delete') && this.enableDeleteThisFrame) {
            this.enableDeleteThisFrame = false;
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                if (cTube.selected.length) {
                    const tube = cTube.clone().filter((_, i) => !cTube.selected.includes(i));
                    cTube.selected.length = 0;
                    ctx.history.setValue(node, CTube, tube);
                }
            }
            return;
        }
        if (input.mouseOver) {
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                const result = view.raycaster.intersectObjects(cTube.pickers);
                if (result.length) {
                    const index = (result[0].object.userData as TubeNodePickerUserData).index;
                    cTube.hovered = index == null ? -1 : index;
                } else {
                    cTube.hovered = -1;
                }
            }
        }
    }

    beforeRender(ctx: EditorContext, view: EditorView) {
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            for (let circle of cTube.circles) {
                circle.quaternion.copy(view.camera.get().quaternion);
            }
        }
    }

    end(ctx: EditorContext) {
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            cTube.updateColor();
        }
    }

    onUnselected(ctx: EditorContext) {
        for (let node of this.nodes) {
            if (node.deleted) {
                continue;
            }
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = false;
            }
            cTube.selected.length = 0;
        }
        this.nodes.length = 0;
    }
}
