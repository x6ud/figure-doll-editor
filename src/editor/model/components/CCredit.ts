import CreditInfo from '../../components/input/CreditInfo/CreditInfo.vue';
import {deepClone} from '../../utils/clone';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

export type CreditJson = {
    name: string,
    url: string,
    license: {
        name: string,
        url: string,
    },
    user: {
        name: string,
        url: string,
    }
};

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    clone: deepClone,
    label: 'Credit',
    inputComponent: CreditInfo,
    serialize(val: CreditJson | null) {
        return val ? JSON.stringify(val) : '';
    },
    deserialize(val: string) {
        return val ? JSON.parse(val) : null;
    }
})
export default class CCredit extends ModelNodeComponent<CreditJson | null> {
    value: CreditJson | null = null;
}
