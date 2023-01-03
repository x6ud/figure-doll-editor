export default class EditorOptions {
    enablePressure: boolean = true;
    symmetry: 'no' | 'x' | 'y' | 'z' = 'no';
    remeshVoxelSize: number = 0.003;

    keepTransformUnchangedWhileMoving: boolean = true;
    useLocalSpaceForTransformControl: boolean = true;
    allowModifyingBoneLengthWhenBindingIk: boolean = true;
    keepInternalTransformWhenBindingIk: boolean = true;

    quadView: boolean = false;
    showGrids: boolean = true;
    showIkBones: boolean = false;
}
