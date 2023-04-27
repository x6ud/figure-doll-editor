/** Editor options that will be written to browser local storge when changed */
export default class EditorOptions {
    shadingMode: 'solid' | 'rendered' | 'depth' | 'edge' = 'solid';

    enablePressure: boolean = true;
    remeshVoxelSize: number = 0.003;
    paintColor: [number, number, number] = [1, 0, 1];

    depthMapOffset: number = 0.0;
    depthMapScale: number = 0.1;
    edgeDetectNormalThreshold: number = 0.5;
    edgeDetectDepthThreshold: number = 0.1;

    sdServer = 'http://localhost:7860';
    sdWidth = 512;
    sdHeight = 512;
    sdPrompt = '';
    sdNPrompt = '';
    sdPromptA = 'best quality, extremely detailed';
    sdNPromptA = 'longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality';
    sdSampler = '';
    sdSteps = 30;
    sdInputImg = false;
    sdCnDepthModel = '';
    sdCnDepthEnabled = false;
    sdCnDepthWeight = 1.0;
    sdCnDepthGuidanceStart = 0.0;
    sdCnDepthGuidanceEnd = 1.0;
    sdCnDepthControlMode = 0;
    sdCnEdgeModel = '';
    sdCnEdgeEnabled = false;
    sdCnEdgeWeight = 1.0;
    sdCnEdgeGuidanceStart = 0.0;
    sdCnEdgeGuidanceEnd = 1.0;
    sdCnEdgeControlMode = 0;
    sdCnPoseModel = '';
    sdCnPoseEnabled = false;
    sdCnPoseWeight = 1.0;
    sdCnPoseGuidanceStart = 0.0;
    sdCnPoseGuidanceEnd = 1.0;
    sdCnPoseControlMode = 0;

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
    showOpenPoseKeypoints: boolean = false;

    tools: { [name: string]: { [prop: string]: any } } = {};
}
