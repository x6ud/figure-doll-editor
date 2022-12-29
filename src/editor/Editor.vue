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
                    <popup-menu-item title="Options">
                        <popup-menu>
                            <popup-menu-item title="Keep World Position Unchanged When Moving Nodes"
                                             @click="editorCtx.options.keepTransformUnchangedWhileMoving = !editorCtx.options.keepTransformUnchangedWhileMoving"
                                             :checked="editorCtx.options.keepTransformUnchangedWhileMoving"
                            />
                            <popup-menu-item sep/>
                            <popup-menu-item title="Allow Modification of Bone Length When Modifying IK Bindings"
                                             @click="editorCtx.options.allowModifyingBoneLengthWhenBindingIk = !editorCtx.options.allowModifyingBoneLengthWhenBindingIk"
                                             :checked="editorCtx.options.allowModifyingBoneLengthWhenBindingIk"
                            />
                            <popup-menu-item title="Keep Internal Object Position Unchanged When Modifying IK Bindings"
                                             @click="editorCtx.options.keepInternalTransformWhenBindingIk = !editorCtx.options.keepInternalTransformWhenBindingIk"
                                             :checked="editorCtx.options.keepInternalTransformWhenBindingIk"
                            />
                        </popup-menu>
                    </popup-menu-item>
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
                    <popup-menu-item title="Grids"
                                     :checked="editorCtx.options.showGrids"
                                     @click="editorCtx.options.showGrids = !editorCtx.options.showGrids"
                    />
                    <popup-menu-item title="IK Bones"
                                     :checked="editorCtx.options.showIkBones"
                                     @click="editorCtx.options.showIkBones = !editorCtx.options.showIkBones"
                    />
                    <popup-menu-item title="Quad Views"
                                     :checked="editorCtx.options.quadView"
                                     @click="editorCtx.options.quadView = !editorCtx.options.quadView"
                    />
                </popup-menu>

                <template v-if="editorCtx.tool.sculpt">
                    <div class="separator"></div>
                    <label-range style="margin-right: 4px;"
                                 v-model:value="editorCtx.tool.brushRadius"
                                 label="Radius"
                                 :min="5"
                                 :max="400"
                                 :step="1"
                                 :fraction-digits="0"
                    />
                    <label-range style="margin-right: 8px;"
                                 v-model:value="editorCtx.tool.brushStrength"
                                 label="Strength"
                                 :min="0.01"
                                 :max="1"
                                 :step="0.001"
                                 :fraction-digits="3"
                    />
                    <div class="button-group cols" style="margin-right: 8px"
                         title="Direction"
                         v-if="editorCtx.tool.hasDirection"
                    >
                        <button class="normal-button toggle-button"
                                style="font-size: 14px;"
                                :class="{active: editorCtx.tool.brushDirection === 1}"
                                @click="editorCtx.tool.brushDirection = 1"
                        >
                            +
                        </button>
                        <button class="normal-button toggle-button"
                                style="font-size: 12px;"
                                :class="{active: editorCtx.tool.brushDirection === 0}"
                                @click="editorCtx.tool.brushDirection = 0"
                                v-if="editorCtx.tool.hasThirdDirection"
                        >
                            o
                        </button>
                        <button class="normal-button toggle-button"
                                style="font-size: 14px;"
                                :class="{active: editorCtx.tool.brushDirection === -1}"
                                @click="editorCtx.tool.brushDirection = -1"
                        >
                            -
                        </button>
                    </div>
                    <select v-model="editorCtx.options.symmetry"
                            title="Symmetry"
                            style="margin-right: 8px"
                    >
                        <option value="no">No Symm</option>
                        <option value="x">Symm X</option>
                        <option value="y">Symm Y</option>
                        <option value="z">Symm Z</option>
                    </select>
                    <popup-menu title="Remesh"
                                class-name="normal-button dropdown"
                                v-if="canRemesh"
                    >
                        <div class="properties">
                            <div class="property inline">
                                <label>Voxel size</label>
                                <input-number class="value"
                                              style="width: 6em; text-align: right;"
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
                <div style="font-size: 8px;">FPS: {{ editorCtx.fps }}</div>
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
                        <button :disabled="!editorCtx.model.selected.length"
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
                                @convertToClay="onConvertToClay"
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
                                           @set-data="onSetNodeProperty"
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

        <div class="status-bar"
             v-if="uiOptions.showStatusBar"
        >
            {{ editorCtx?.statusBarMessage }}
        </div>
    </div>

    <fullscreen-loading v-if="fullscreenLoading"/>
</template>

<script src="./Editor.ts"></script>

<style src="./ui.scss"></style>

<style lang="scss" scoped>

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
</style>
