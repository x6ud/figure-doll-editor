export default class EditorOptions {
    shadingMode: 'solid' | 'rendered' = 'solid';

    enablePressure: boolean = true;
    remeshVoxelSize: number = 0.003;
    paintColor: [number, number, number] = [1, 0, 1];

    keepTransformUnchangedWhileMoving: boolean = true;
    useLocalSpaceForTransformControl: boolean = true;
    allowModifyingBoneLengthWhenBindingIk: boolean = true;
    keepInternalTransformWhenBindingIk: boolean = true;

    quadView: boolean = false;
    outlineSelected: boolean = true;
    showGrids: boolean = true;
    showLightHelpers: boolean = false;
    showIkBones: boolean = false;

    tools: { [name: string]: { [prop: string]: any } } = {};
}
