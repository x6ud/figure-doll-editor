import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CTube, {TubeNodePickerUserData} from '../model/components/CTube';
import ModelNode from '../model/ModelNode';
import EditorTool from './EditorTool';
import icon from './Tube.png';

export default class TubeTool extends EditorTool {
    label = 'Tube';
    icon = icon;

    private nodes: ModelNode[] = [];

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
        this.nodes = ctx.model.getSelectedNodes().filter(node => node.has(CTube));
        for (let node of this.nodes) {
            const cTube = node.get(CTube);
            if (cTube.group) {
                cTube.group.visible = true;
            }
            cTube.hovered = -1;
        }
    }

    update(ctx: EditorContext, view: EditorView) {
        const input = view.input;
        if (input.mouseOver) {
            for (let node of this.nodes) {
                const cTube = node.get(CTube);
                const result = view.raycaster.intersectObjects(cTube.pickers);
                if (result.length) {
                    const index = (result[0].object.userData as TubeNodePickerUserData).index;
                    cTube.hovered = index == null ? -1 : index;
                    if (index != null) {
                        if (input.mouseLeftDownThisFrame) {
                            if (input.isKeyPressed('Control')) {
                                cTube.addSelection(index);
                            } else {
                                cTube.selected = [index];
                            }
                        }
                    }

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
