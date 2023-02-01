declare module '*.vue' {
    import {DefineComponent} from 'vue';
    const content: DefineComponent<{}, {}, any>;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}
