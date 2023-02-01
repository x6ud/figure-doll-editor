export default abstract class ModelNodeComponent<T> {
    abstract value: T;

    onRemoved() {
    }
}
