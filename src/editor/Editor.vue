<template>
    <div class="container rows"
         tabindex="0"
         @keydown.ctrl.z="onUndo"
         @keydown.ctrl.y="onRedo"
         @keydown.ctrl.o.prevent="onOpen"
         @keydown.ctrl.s.prevent="onSave"
         @contextmenu.prevent
         ref="dom"
    >
        <div class="toolbar">
            <template v-if="editorContext">
                <popup-menu>
                    <template #trigger>File</template>
                    <popup-menu-item title="New" @click="onNew"/>
                    <popup-menu-item title="Open" popup hotkey="Ctrl+O" @click="onOpen"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Save" hotkey="Ctrl+S" @click="onSave"/>
                    <popup-menu-item title="Save As" popup hotkey="Shirt+Ctrl+S" @click="onSaveAs"/>
                </popup-menu>
                <popup-menu>
                    <template #trigger>Edit</template>
                    <popup-menu-item title="Undo" hotkey="Ctrl+Z" @click="onUndo"/>
                    <popup-menu-item title="Redo" hotkey="Ctrl+Y" @click="onRedo"/>
                </popup-menu>
                <popup-menu>
                    <template #trigger>View</template>
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
            <side-panel direction="right"
                        v-model:width="modelTreePanelWidth"
            >
                <div class="rows" style="width: 100%; height: 100%;"
                     v-if="editorContext"
                >
                    <div class="toolbar">
                        <popup-menu :disabled="!validChildNodeDefs.length">
                            <template #trigger>Add</template>
                            <popup-menu-item v-for="def in validChildNodeDefs"
                                             :key="def.name"
                                             :title="def.label"
                                             @click="onAddNode(def.name)"
                            />
                        </popup-menu>
                        <button :disabled="!editorContext.model.selected.length"
                                @click="onRemoveNodes"
                        >
                            Delete
                        </button>
                    </div>
                    <model-tree class="fill"
                                :model="editorContext.model"
                                @select="onSelect"
                                @set-value="onSetValue"
                                @move-node="onMoveNode"
                    />
                </div>
            </side-panel>
            <side-panel direction="right"
                        v-model:width="modelNodePropertiesPanelWidth"
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
    </div>
</template>

<script src="./Editor.ts"></script>

<style src="./ui.scss"></style>
