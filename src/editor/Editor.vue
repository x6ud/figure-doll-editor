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
            <template v-if="editorContext">
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
                    <popup-menu-item title="Keep Global Transformation Unchanged When Moving Nodes"
                                     @click="editorContext.keepTransformUnchangedWhileMoving = !editorContext.keepTransformUnchangedWhileMoving"
                                     :checked="editorContext.keepTransformUnchangedWhileMoving"
                    />
                </popup-menu>
                <popup-menu title="View">
                    <popup-menu-item title="Window">
                        <popup-menu>
                            <popup-menu-item title="Tools"
                                             :checked="showTools"
                                             @click="showTools = !showTools"
                            />
                            <popup-menu-item title="Nodes Panel"
                                             :checked="showModelTree"
                                             @click="showModelTree = !showModelTree"
                            />
                            <popup-menu-item title="Properties Panel"
                                             :checked="showProperties"
                                             @click="showProperties = !showProperties"
                            />
                            <popup-menu-item title="Status Bar"
                                             :checked="showStatusBar"
                                             @click="showStatusBar = !showStatusBar"
                            />
                        </popup-menu>
                    </popup-menu-item>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Grids"
                                     :checked="editorContext.showGrids"
                                     @click="editorContext.showGrids = !editorContext.showGrids"
                    />
                    <popup-menu-item title="Quad Views"
                                     :checked="editorContext.quadView"
                                     @click="editorContext.quadView = !editorContext.quadView"
                    />
                </popup-menu>
                <div class="fill"></div>
                <div style="font-size: 8px;">FPS: {{ editorContext.fps }}&nbsp;</div>
            </template>
        </div>

        <div class="cols fill">
            <div class="tools scrollable"
                 v-if="showTools"
            >
                <div class="scroll">
                    <div v-if="editorContext">
                        <template v-for="tool in editorContext.tools">
                            <template v-if="tool.sep">
                                <hr>
                            </template>
                            <template v-if="!tool.sep">
                                <button class="tool icon-button toggle-button"
                                        :title="tool.label"
                                        :class="{active: editorContext.tool === tool}"
                                        @click="editorContext.tool = tool"
                                >
                                    <img :src="tool.icon" alt="">
                                </button>
                            </template>
                        </template>
                    </div>
                </div>
            </div>

            <side-panel direction="right"
                        v-model:width="modelTreePanelWidth"
                        style="border-left: none;"
                        v-if="showModelTree"
            >
                <div class="rows" style="width: 100%; height: 100%;"
                     v-if="editorContext"
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
                                             @click="onAddNode(def.name)"
                            />
                        </popup-menu>
                        <button :disabled="!editorContext.model.selected.length"
                                @click="onDelete"
                        >
                            Delete
                        </button>
                    </div>
                    <model-tree class="fill"
                                :model="editorContext.model"
                                @select="onSelect"
                                @set-value="onSetValue"
                                @move-node="onMoveNode"
                                @focus="onFocus"
                                @cut="onCut"
                                @copy="onCopy"
                                @paste="onPaste"
                                @delete="onDelete"
                    />
                </div>
            </side-panel>

            <side-panel direction="right"
                        v-model:width="modelNodePropertiesPanelWidth"
                        style="border-left: none;"
                        v-if="showProperties"
            >
                <template v-if="editorContext">
                    <model-node-properties :editor-context="editorContext"
                                           @set-data="onSetNodeProperty"
                    />
                </template>
            </side-panel>

            <quad-view class="fill"
                       :editor-context="editorContext"
                       :quad-view="editorContext?.quadView"
                       :main-view="editorContext?.mainViewIndex"
                       @mounted="onCanvasMounted"
                       @before-unmount="onBeforeCanvasUnmount"
                       @set-view="onSetView"
            />
        </div>

        <div class="status-bar"
             v-if="showStatusBar"
        >
            {{ editorContext?.statusBarMessage }}
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
