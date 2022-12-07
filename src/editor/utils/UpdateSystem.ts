export default abstract class UpdateSystem<T> {

    protected subSystems: UpdateSystem<T>[] = [];

    abstract begin(ctx: T): void;

    abstract end(ctx: T): void;

    setup(ctx: T) {
    }

    dispose() {
    }

    sub(...systems: UpdateSystem<T>[]) {
        this.subSystems.push(...systems);
        return this;
    }

    update(ctx: T) {
        this.begin(ctx);
        for (let sub of this.subSystems) {
            sub.update(ctx);
        }
        this.end(ctx);
    }

}
