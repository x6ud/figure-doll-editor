export default class EditorOptions {
    symmetry: 'no' | 'x' | 'y' | 'z' = 'no';
    remeshVoxelSize: number = 0.005;

    keepTransformUnchangedWhileMoving: boolean = true;
    useLocalSpaceForTransformControl: boolean = true;
    allowModifyingBoneLengthWhenBindingIk: boolean = true;
    keepInternalTransformWhenBindingIk: boolean = true;

    quadView: boolean = false;
    showGrids: boolean = true;
    showIkBones: boolean = false;
}
