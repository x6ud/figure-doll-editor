import {Matrix4, Vector3} from 'three';
import EditorContext from '../EditorContext';
import EditorView from '../EditorView';
import CPosition from '../model/components/CPosition';
import ModelNode from '../model/ModelNode';
import {getTranslation} from '../utils/math';
import EditorTool from './EditorTool';
import icon from './Translate.png';

const _mat = new Matrix4();

export default class TranslateTool extends EditorTool {
    label = 'Translate';
    icon = icon;

    /** Selected topmost nodes with position component */
    private nodes: ModelNode[] = [];
    /** The difference world matrices of other nodes relative to the first node */
    private detMat: Matrix4[] = [];
    /** Is control dragging previous frame */
    private dragging = false;

    begin(ctx: EditorContext) {
        this.nodes = ctx.model.getTopmostSelectedNodes().filter(node => node.has(CPosition));
        if (!this.nodes.length) {
            this.enableTransformControls = false;
            return;
        }
        this.enableTransformControls = true;
        if (!this.dragging) {
            this.nodes[0].getWorldMatrix().decompose(
                ctx.dummyObject.position,
                ctx.dummyObject.quaternion,
                ctx.dummyObject.scale
            );
            this.detMat.length = this.nodes.length - 1;
            if (this.detMat.length) {
                _mat.copy(this.nodes[0].getWorldMatrix()).invert();
                for (let i = 0; i < this.detMat.length; ++i) {
                    if (!this.detMat[i]) {
                        this.detMat[i] = new Matrix4();
                    }
                    this.detMat[i].multiplyMatrices(_mat, this.nodes[i + 1].getWorldMatrix());
                }
            }
        }
        this.dragging = false;
    }

    update(ctx: EditorContext, view: EditorView): void {
        if (!this.enableTransformControls) {
            return;
        }
        const control = view.transformControls;
        control.setMode('translate');
        if (control.dragging) {
            this.dragging = true;
            const matrix = ctx.dummyObject.matrix;
            for (let i = 0; i < this.nodes.length; ++i) {
                const node = this.nodes[i];
                _mat.copy(node.getParentWorldMatrix()).invert().multiply(matrix);
                if (i > 0) {
                    _mat.multiply(this.detMat[i - 1]);
                }
                ctx.history.setValue(node, CPosition, getTranslation(new Vector3(), _mat));
            }
        }
    }
}
