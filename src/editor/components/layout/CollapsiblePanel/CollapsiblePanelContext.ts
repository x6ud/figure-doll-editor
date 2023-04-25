export default class CollapsiblePanelContext {
    collapse: () => void;

    constructor(collapse: () => void) {
        this.collapse = collapse;
    }
}
