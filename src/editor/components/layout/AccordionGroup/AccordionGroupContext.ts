import CollapsiblePanelContext from '../CollapsiblePanel/CollapsiblePanelContext';

export default class AccordionGroupContext {
    private panels: CollapsiblePanelContext[] = [];

    register(panel: CollapsiblePanelContext) {
        this.panels.push(panel);
    }

    panelExpand(target: CollapsiblePanelContext) {
        for (let panel of this.panels) {
            if (panel !== target) {
                panel.collapse();
            }
        }
    }
}
