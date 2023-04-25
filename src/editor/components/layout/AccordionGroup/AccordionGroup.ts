import {defineComponent, provide} from 'vue';
import AccordionGroupContext from './AccordionGroupContext';

export default defineComponent({
    setup() {
        provide('accordion-group-context', new AccordionGroupContext());
    }
});
