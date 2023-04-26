import InputSelect from '../../components/input/InputSelect/InputSelect.vue';
import ModelNodeComponent from '../ModelNodeComponent';
import {DataType, registerModelComponent} from '../ModelNodeComponentDef';

export type OpenPoseKeypointValue =
    'nose'
    | 'neck'
    | 'right_shoulder'
    | 'right_elbow'
    | 'right_wrist'
    | 'left_shoulder'
    | 'left_elbow'
    | 'left_wrist'
    | 'right_hip'
    | 'right_knee'
    | 'right_ankle'
    | 'left_hip'
    | 'left_knee'
    | 'left_ankle'
    | 'right_eye'
    | 'left_eye'
    | 'right_ear'
    | 'left_ear';

@registerModelComponent({
    storable: true,
    dataType: DataType.STRING,
    instanceable: true,
    label: 'Type',
    inputComponent: InputSelect,
    inputComponentProps: {
        options: [
            '',
            'nose',
            'neck',
            'right_shoulder',
            'right_elbow',
            'right_wrist',
            'left_shoulder',
            'left_elbow',
            'left_wrist',
            'right_hip',
            'right_knee',
            'right_ankle',
            'left_hip',
            'left_knee',
            'left_ankle',
            'right_eye',
            'left_eye',
            'right_ear',
            'left_ear',
        ]
    }
})
export default class COpenPoseKeypoint extends ModelNodeComponent<OpenPoseKeypointValue | ''> {
    value: OpenPoseKeypointValue | '' = '';
}
