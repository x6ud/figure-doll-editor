<template>
    <div class="container">
        <quad-view style="width: 100%; height: 100%;"
                   :editor-context="editorContext"
                   :quad-view="editorContext?.quadView"
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
