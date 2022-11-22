import EditorContext from '../EditorContext';

export default abstract class ModelNodeComponent<T> {
    abstract value: T;

    onRemoved(ctx: EditorContext) {
    }
}
