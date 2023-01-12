import {defineComponent, PropType} from 'vue';
import {CreditJson} from '../../../model/components/CCredit';

export default defineComponent({
    props: {
        value: Object as PropType<CreditJson>
    },
    setup() {
    }
});
