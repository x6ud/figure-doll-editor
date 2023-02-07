<template>
    <div class="container rows"
         tabindex="0"
         @keydown.ctrl.z="onUndo"
         @keydown.ctrl.y="onRedo"
         @keydown.ctrl.o.prevent="onOpen"
         @keydown.ctrl.s.prevent="onSave"
         @keydown.ctrl.x="onCut"
         @keydown.ctrl.c="onCopy"
         @keydown.ctrl.v="onPaste"
         @keydown.delete="onDelete"
         @contextmenu.prevent
         ref="dom"
    >
        <div class="toolbar">
            <template v-if="editorCtx">
                <popup-menu title="File">
                    <popup-menu-item title="New" @click="onNew"/>
                    <popup-menu-item title="Open" popup hotkey="Ctrl+O" @click="onOpen"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Save" hotkey="Ctrl+S" @click="onSave"/>
                    <popup-menu-item title="Save As" popup hotkey="Shirt+Ctrl+S" @click="onSaveAs"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Import" popup @click="onImport"/>
                    <popup-menu-item title="Export">
                        <popup-menu>
                            <popup-menu-item title="glTF 2.0 Binary (.glb)" popup @click="onExport('glb')"/>
                            <popup-menu-item title="Wavefront (.obj)" popup @click="onExport('obj')"/>
                        </popup-menu>
                    </popup-menu-item>
                </popup-menu>
                <popup-menu title="Edit">
                    <popup-menu-item title="Undo" hotkey="Ctrl+Z" @click="onUndo"/>
                    <popup-menu-item title="Redo" hotkey="Ctrl+Y" @click="onRedo"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Cut" hotkey="Ctrl+X" @click="onCut"/>
                    <popup-menu-item title="Copy" hotkey="Ctrl+C" @click="onCopy"/>
                    <popup-menu-item title="Paste" hotkey="Ctrl+V" @click="onPaste"/>
                    <popup-menu-item title="Delete" hotkey="Delete" @click="onDelete"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Move Nodes: Keep World Position Unchanged"
                                     @click="editorCtx.options.keepTransformUnchangedWhileMoving = !editorCtx.options.keepTransformUnchangedWhileMoving"
                                     :checked="editorCtx.options.keepTransformUnchangedWhileMoving"
                    />
                    <popup-menu-item sep/>
                    <popup-menu-item title="Transform: Use Local Space For Controls"
                                     @click="editorCtx.options.useLocalSpaceForTransformControl = !editorCtx.options.useLocalSpaceForTransformControl"
                                     :checked="editorCtx.options.useLocalSpaceForTransformControl"
                    />
                    <popup-menu-item sep/>
                    <popup-menu-item title="IK Bind: Allow Modification of Joint Length"
                                     @click="editorCtx.options.allowModifyingBoneLengthWhenBindingIk = !editorCtx.options.allowModifyingBoneLengthWhenBindingIk"
                                     :checked="editorCtx.options.allowModifyingBoneLengthWhenBindingIk"
                    />
                    <popup-menu-item title="IK Bind: Keep Internal Object Position Unchanged"
                                     @click="editorCtx.options.keepInternalTransformWhenBindingIk = !editorCtx.options.keepInternalTransformWhenBindingIk"
                                     :checked="editorCtx.options.keepInternalTransformWhenBindingIk"
                    />
                    <popup-menu-item sep/>
                    <popup-menu-item title="Stretch Joint: Keep Both Ends of Clay Nodes Unchanged"
                                     @click="editorCtx.options.keepBothEndsOfClayNodesWhenStretching = !editorCtx.options.keepBothEndsOfClayNodesWhenStretching"
                                     :checked="editorCtx.options.keepBothEndsOfClayNodesWhenStretching"
                    />
                </popup-menu>
                <popup-menu title="View">
                    <popup-menu-item title="Window">
                        <popup-menu>
                            <popup-menu-item title="Tools"
                                             :checked="uiOptions.showTools"
                                             @click="uiOptions.showTools = !uiOptions.showTools"
                            />
                            <popup-menu-item title="Nodes Panel"
                                             :checked="uiOptions.showModelTree"
                                             @click="uiOptions.showModelTree = !uiOptions.showModelTree"
                            />
                            <popup-menu-item title="Properties Panel"
                                             :checked="uiOptions.showProperties"
                                             @click="uiOptions.showProperties = !uiOptions.showProperties"
                            />
                            <popup-menu-item title="Status Bar"
                                             :checked="uiOptions.showStatusBar"
                                             @click="uiOptions.showStatusBar = !uiOptions.showStatusBar"
                            />
                        </popup-menu>
                    </popup-menu-item>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Quad Views"
                                     :checked="editorCtx.options.quadView"
                                     @click="editorCtx.options.quadView = !editorCtx.options.quadView"
                    />
                    <popup-menu-item title="Outline Selected"
                                     :checked="editorCtx.options.outlineSelected"
                                     @click="editorCtx.options.outlineSelected = !editorCtx.options.outlineSelected"
                    />
                    <popup-menu-item sep/>
                    <popup-menu-item title="Grids"
                                     :checked="editorCtx.options.showGrids"
                                     @click="editorCtx.options.showGrids = !editorCtx.options.showGrids"
                    />
                    <popup-menu-item title="Light Indicators"
                                     :checked="editorCtx.options.showLightHelpers"
                                     @click="editorCtx.options.showLightHelpers = !editorCtx.options.showLightHelpers"
                    />
                    <popup-menu-item title="IK Joint Indicators"
                                     :checked="editorCtx.options.showIkBones"
                                     @click="editorCtx.options.showIkBones = !editorCtx.options.showIkBones"
                    />
                </popup-menu>
                <popup-menu title="Sketchfab"
                            dynamic-size
                >
                    <div class="properties">
                        <template v-if="sketchfabClient.token.accessToken">
                            <div class="cols" style="align-items: center; margin-bottom: 8px;">
                                <input type="text"
                                       placeholder="Sketchfab Model URL"
                                       style="margin-right: 4px; width: 260px;"
                                       v-model="sketchfabModelUrl"
                                       @keydown.enter="onSketchfabImportModel"
                                >
                                <button class="normal-button"
                                        style="font-size: 8px; padding: 2px 6px;"
                                        @click="onSketchfabImportModel"
                                >
                                    Import
                                </button>
                            </div>
                            <div class="cols" style="align-items: center;">
                                <div class="fill"></div>
                                <div style="margin-right: 4px;">
                                    {{ sketchfabClient.user.displayName }}
                                </div>
                                <button class="normal-button"
                                        @click="onSketchfabLogout"
                                        style="font-size: 8px; padding: 2px 6px;"
                                >
                                    Logout
                                </button>
                            </div>
                        </template>
                        <template v-else>
                            <button class="normal-button"
                                    @click="onSketchfabLogin"
                            >
                                Sketchfab Login
                            </button>
                        </template>
                    </div>
                </popup-menu>
                <popup-menu title="Camera"
                            dynamic-size
                >
                    <div class="properties">
                        <div class="cols" style="align-items: center; margin-bottom: 8px;">
                            <div style="margin-right: 4px;">FOV</div>
                            <input-number style="width: 4em; margin-right: 8px;"
                                          :min="4"
                                          :max="90"
                                          :value="editorCtx.model.cameraFov"
                                          @input="editorCtx.model.cameraFov = $event"
                            />
                            <input-boolean label="Orthographic"
                                           :value="!editorCtx.model.cameraPerspective"
                                           @input="editorCtx.model.cameraPerspective = !$event"
                            />
                        </div>
                        <div class="camera-list">
                            <div class="item"
                                 v-for="camera in editorCtx.model.cameras"
                            >
                                <div class="name normal-button"
                                     @click="onLoadCamera(camera)"
                                >
                                    {{ camera.name }}
                                </div>
                                <button class="icon-button" @click="onDeleteCamera(i)">×</button>
                            </div>
                        </div>
                        <button class="normal-button"
                                style="width: 100%; margin-top: 4px;"
                                @click="onSaveCamera"
                        >
                            Save Current
                        </button>
                    </div>
                </popup-menu>
                <popup-menu title="About"
                            dynamic-size
                >
                    <div class="properties cols">
                        <div>
                            <img src="./icons/icon.png" alt="">
                        </div>
                        <div style="padding: 4px 6px 4px 8px;">
                            <div style="margin-bottom: 6px;">
                                <span style="font-size: 16px; font-weight: bold;">
                                    Figure Doll Editor
                                </span>
                                Ver 20230207
                            </div>
                            <div style="margin-bottom: 6px;">Author: x6udpngx</div>
                            <div style="margin-bottom: 6px;">
                                <a href="https://github.com/x6ud/figure-doll-editor"
                                   target="_blank"
                                >
                                    Source
                                </a>
                            </div>
                            <div>
                                <a href="https://ko-fi.com/x6udpngx"
                                   target="_blank"
                                >
                                    <img src="./icons/kofi.png" alt=""
                                         style="vertical-align: text-bottom;"
                                    >
                                    Support Me on Ko-fi
                                </a>
                            </div>
                        </div>
                    </div>
                </popup-menu>
                <button class="popup-menu-trigger"
                        @click="onOpenTutorial"
                        style="cursor: pointer;"
                >
                    Tutorial
                </button>

                <template v-if="editorCtx.tool.sculpt">
                    <div class="separator"></div>
                    <label-range style="margin-right: 6px;"
                                 v-model:value="editorCtx.tool.brushRadius"
                                 label="Radius"
                                 :min="1"
                                 :max="200"
                                 :step="1"
                                 :fraction-digits="0"
                    />
                    <label-range style="margin-right: 6px;"
                                 v-if="editorCtx.tool.hasHardness"
                                 v-model:value="editorCtx.tool.brushHardness"
                                 label="Hardness"
                                 :min="0.01"
                                 :max="1"
                                 :step="0.01"
                                 :fraction-digits="2"
                    />
                    <label-range style="margin-right: 2px;"
                                 v-model:value="editorCtx.tool.brushStrength"
                                 label="Strength"
                                 :min="0.01"
                                 :max="1"
                                 :step="0.01"
                                 :fraction-digits="2"
                    />
                    <button class="normal-button toggle-button"
                            title="Enable Tablet Pressure Sensitivity"
                            style="margin-right: 6px; padding: 0;"
                            :class="{active: editorCtx.options.enablePressure}"
                            @click="editorCtx.options.enablePressure = !editorCtx.options.enablePressure"
                    >
                        <img src="./icons/pressure.png" alt="">
                    </button>
                    <button class="normal-button toggle-button"
                            title="Front Faces Only"
                            style="margin-right: 6px; padding: 0;"
                            :class="{active: editorCtx.tool.frontFacesOnly}"
                            @click="editorCtx.tool.frontFacesOnly = !editorCtx.tool.frontFacesOnly"
                    >
                        <img src="./icons/front-face.png" alt="">
                    </button>
                    <div class="button-group cols" style="margin-right: 6px"
                         title="Direction"
                         v-if="editorCtx.tool.hasDirection"
                    >
                        <button class="normal-button toggle-button"
                                style="padding: 0;"
                                :class="{active: editorCtx.tool.brushDirection === 1}"
                                @click="editorCtx.tool.brushDirection = 1"
                        >
                            <img src="./icons/plus.png" alt="">
                        </button>
                        <button class="normal-button toggle-button"
                                style="padding: 0;"
                                :class="{active: editorCtx.tool.brushDirection === 0}"
                                @click="editorCtx.tool.brushDirection = 0"
                                v-if="editorCtx.tool.hasThirdDirection"
                        >
                            <img src="./icons/zero.png" alt="">
                        </button>
                        <button class="normal-button toggle-button"
                                style="padding: 0;"
                                :class="{active: editorCtx.tool.brushDirection === -1}"
                                @click="editorCtx.tool.brushDirection = -1"
                        >
                            <img src="./icons/minus.png" alt="">
                        </button>
                    </div>
                    <popup-menu title="Remesh"
                                class-name="normal-button dropdown"
                                v-if="canRemesh"
                    >
                        <div class="properties">
                            <div class="property inline">
                                <label>Voxel size</label>
                                <input-number class="value"
                                              style="width: 6em;"
                                              :min="0.0001"
                                              :max="1"
                                              :value="editorCtx.options.remeshVoxelSize"
                                              @input="editorCtx.options.remeshVoxelSize = $event"
                                />
                                <span>&nbsp;m</span>
                            </div>
                            <button class="normal-button"
                                    style="width: 100%"
                                    @click="onRemesh"
                            >
                                Remesh
                            </button>
                        </div>
                    </popup-menu>
                </template>
                <div class="fill"></div>
                <div class="button-group cols">
                    <button class="normal-button toggle-button"
                            title="Shadow Off"
                            style="padding: 0;"
                            :class="{active: editorCtx.options.shadingMode === 'solid'}"
                            @click="editorCtx.options.shadingMode = 'solid'"
                    >
                        <img src="./icons/shading-solid.png" alt="">
                    </button>
                    <button class="normal-button toggle-button"
                            title="Shadow On"
                            style="padding: 0;"
                            :class="{active: editorCtx.options.shadingMode === 'rendered'}"
                            @click="editorCtx.options.shadingMode = 'rendered'"
                    >
                        <img src="./icons/shading-rendered.png" alt="">
                    </button>
                </div>
            </template>
        </div>

        <div class="cols fill">
            <div class="tools scrollable"
                 v-if="uiOptions.showTools"
            >
                <div class="scroll">
                    <div v-if="editorCtx">
                        <template v-for="tool in editorCtx.tools">
                            <template v-if="tool.sep">
                                <hr>
                            </template>
                            <template v-if="!tool.sep">
                                <button class="tool icon-button toggle-button"
                                        :title="tool.label"
                                        :class="{active: editorCtx.tool === tool}"
                                        @click="editorCtx.tool = tool"
                                >
                                    <img :src="tool.icon" alt="">
                                </button>
                            </template>
                        </template>
                    </div>
                </div>
            </div>

            <side-panel direction="right"
                        v-model:width="uiOptions.modelTreePanelWidth"
                        style="border-left: none;"
                        v-if="uiOptions.showModelTree"
            >
                <div class="rows" style="width: 100%; height: 100%;"
                     v-if="editorCtx"
                >
                    <div class="toolbar"
                         @click.self="onSelect([])"
                    >
                        <popup-menu title="Add"
                                    :disabled="!validChildNodeDefs.length"
                        >
                            <popup-menu-item v-for="def in validChildNodeDefs"
                                             :key="def.name"
                                             :title="def.label"
                                             :icon="def.icon"
                                             @click="onAddNode(def.name)"
                            />
                        </popup-menu>
                        <button :disabled="!canDelete"
                                @click="onDelete"
                        >
                            Delete
                        </button>
                    </div>
                    <model-tree class="fill"
                                :model="editorCtx.model"
                                @select="onSelect"
                                @set-value="onSetValue"
                                @move-node="onMoveNode"
                                @focus="onFocus"
                                @cut="onCut"
                                @copy="onCopy"
                                @paste="onPaste"
                                @delete="onDelete"
                                @convert-to-clay="onConvertToClay"
                                @apply-transformation="onApplyTransformation"
                                @create-instance="onCreateInstance"
                                @flip="onFlip"
                                @copy-pose="onCopyPose"
                                @paste-pose="onPastePose"
                    />
                </div>
            </side-panel>

            <side-panel direction="right"
                        v-model:width="uiOptions.modelNodePropertiesPanelWidth"
                        style="border-left: none;"
                        v-if="uiOptions.showProperties"
            >
                <template v-if="editorCtx">
                    <model-node-properties :editor-context="editorCtx"
                                           @set-data="onSetNodesProperties"
                    />
                </template>
            </side-panel>

            <quad-view class="fill"
                       :editor-context="editorCtx"
                       :quad-view="editorCtx?.options?.quadView"
                       :main-view="editorCtx?.mainViewIndex"
                       @mounted="onCanvasMounted"
                       @before-unmount="onBeforeCanvasUnmount"
                       @set-view="onSetView"
            />
        </div>

        <div class="status-bar cols"
             v-if="uiOptions.showStatusBar && editorCtx"
        >
            <div>{{ editorCtx.statusBarMessage }}</div>
            <div class="fill"></div>
            <div>FPS: {{ editorCtx.fps }}</div>
        </div>
    </div>

    <popup-dialog title="Color"
                  v-if="editorCtx"
                  :visible="editorCtx.tool.hasColor"
                  v-model:x="uiOptions.colorPanelX"
                  v-model:y="uiOptions.colorPanelY"
    >
        <color-picker v-model:value="editorCtx.options.paintColor"
                      color-box
        />
    </popup-dialog>

    <popup-dialog v-if="downloadProgressDialog"
                  :visible="downloadProgressDialog"
                  modal
                  title="Downloading"
    >
        <div class="cols" style="align-items: center;">
            <div class="progress-bar"
                 style="width: 260px; margin-right: 4px;"
            >
                <div class="progress"
                     :style="{width: `${downloadProgressPercent}%`}"
                ></div>
                <div class="text">
                    {{ downloadProgressText }} / {{ downloadTotalText }}
                </div>
            </div>
            <button class="normal-button" @click="downloadCancelFlag = true">Cancel</button>
        </div>
    </popup-dialog>

    <fullscreen-loading v-if="fullscreenLoading"/>
</template>

<script src="./Editor.ts"></script>

<style src="./ui.scss"></style>

<style lang="scss" scoped>
.camera-list {
    .item {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .name {
            display: inline-flex;
            align-items: center;
            flex: 1 1;
            font-size: 14px;
            cursor: pointer;
        }
    }
}

.tools {
    display: flex;
    flex-direction: column;
    padding: 0 2px;
    width: 24px;
    border: solid 1px #555;

    .scroll {
        left: 2px;
        top: 2px;
    }

    .tool {
        width: 24px;
        height: 24px;
        margin: 2px 0;
    }

    hr {
        width: 24px;
        height: 1px;
        border: none;
        background: #555;
        margin: 2px 0;
    }
}

.status-bar {
    height: 16px;
    line-height: 16px;
    font-size: 12px;
    padding: 0 2px;
    background: #111;
}

.progress-bar {
    position: relative;
    height: 24px;
    background: #333;
    border-radius: 3px;
    overflow: hidden;

    .progress {
        position: absolute;
        z-index: 1;
        left: 0;
        top: 0;
        height: 100%;
        background: #3390FF;
    }

    .text {
        display: inline-flex;
        align-items: center;
        position: absolute;
        z-index: 2;
        top: 0;
        right: .5em;
        height: 100%;
    }
}

a {
    color: #fff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}
</style>
