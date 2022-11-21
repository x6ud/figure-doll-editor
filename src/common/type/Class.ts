export default interface Class<T> extends Function {
    new(...args: any[]): T;
}
