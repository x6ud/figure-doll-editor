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
            </template>
        </div>
        <quad-view class="fill"
                   :editor-context="editorContext"
                   :quad-view="editorContext?.quadView"
                   :main-view="editorContext?.mainViewIndex"
                   @mounted="onCanvasMounted"
                   @set-view="onSetView"
        />
    </div>
</template>

<script src="./Editor.ts"></script>

<style src="./ui.scss"></style>

<style lang="scss" scoped>
.quad-views {
    width: 100%;
    height: 100%;
}
</style>
