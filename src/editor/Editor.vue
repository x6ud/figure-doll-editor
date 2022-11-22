<template>
    <div class="container rows">
        <div class="toolbar">
            <template v-if="editorContext">
                <popup-menu>
                    <template #trigger>File</template>
                    <popup-menu-item title="New" hotkey="Ctrl+N"/>
                    <popup-menu-item title="Open" popup hotkey="Ctrl+O"/>
                    <popup-menu-item sep/>
                    <popup-menu-item title="Save" hotkey="Ctrl+S"/>
                    <popup-menu-item title="Save As" popup hotkey="Shirt+Ctrl+N"/>
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
                        <popup-menu>
                            <template #trigger>Add</template>
                        </popup-menu>
                    </div>
                </div>
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
