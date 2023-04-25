import {defineComponent, inject, ref, watch} from 'vue';
import AccordionGroupContext from '../AccordionGroup/AccordionGroupContext';
import CollapsiblePanelContext from './CollapsiblePanelContext';

export default defineComponent({
    props: {
        defaultExpand: Boolean
    },
    setup(props, ctx) {
        const collapsed = ref(!props.defaultExpand);

        const accordion = inject<AccordionGroupContext>('accordion-group-context');
        if (accordion) {
            const panelCtx = new CollapsiblePanelContext(function () {
                collapsed.value = true;
            });
            accordion.register(panelCtx);
            watch(collapsed, function (collapsed) {
                if (!collapsed) {
                    accordion.panelExpand(panelCtx);
                }
            });
        }

        return {
            collapsed,
        };
    }
});
