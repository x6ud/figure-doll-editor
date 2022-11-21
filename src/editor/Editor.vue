<template>
    <div class="container">
        <quad-view :quad-view="quadView"
                   @mounted="onCanvasMounted"
                   style="width: 100%; height: 100%;"
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
