/** Editor options that will be written to browser local storge when changed */
export default class EditorOptions {
    shadingMode: 'solid' | 'rendered' | 'depth' | 'edge' = 'solid';

    enablePressure: boolean = true;
    remeshVoxelSize: number = 0.003;
    paintColor: [number, number, number] = [1, 0, 1];

    depthMapOffset: number = 0.0;
    depthMapScale: number = 0.1;
    edgeDetectThreshold: number = 0.5;

    sdServer = 'http://localhost:7860';
    sdWidth = 512;
    sdHeight = 512;
    sdPrompt = '';
    sdNPrompt = '';
    sdPromptA = 'best quality, extremely detailed';
    sdNPromptA = 'longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality';
    sdSampler = '';
    sdSteps = 30;
    sdCnDepthModel = '';
    sdCnDepthEnabled = false;
    sdCnEdgeModel = '';
    sdCnEdgeEnabled = false;

    allowSelectingInvisibleObjectByClicking: boolean = true;
    keepTransformUnchangedWhileMoving: boolean = true;
    useLocalSpaceForTransformControl: boolean = true;
    takeGeometryCenterAsTransformOrigin: boolean = true;
    allowModifyingBoneLengthWhenBindingIk: boolean = true;
    keepInternalTransformWhenBindingIk: boolean = true;
    keepBothEndsOfClayNodesWhenStretching: boolean = true;

    quadView: boolean = false;
    outlineSelected: boolean = true;
    showGrids: boolean = true;
    showLightHelpers: boolean = false;
    showIkBones: boolean = false;

    tools: { [name: string]: { [prop: string]: any } } = {};
}
