<template>
    <div class="canvas-wrapper" ref="wrapper"
         :class="{'quad-view': quadView}"
    >
        <canvas ref="canvas"></canvas>
        <div class="view v1" ref="view1" tabindex="0"></div>
        <div class="view v2" ref="view2" tabindex="0"></div>
        <div class="view v3" ref="view3" tabindex="0"></div>
        <div class="view v4" ref="view4" tabindex="0"></div>
    </div>
</template>

<script src="./QuadView.ts"></script>

<style lang="scss" scoped>
.canvas-wrapper {
    position: relative;
    overflow: hidden;

    canvas {
        position: absolute;
        z-index: 0;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        outline: none;
    }

    .view {
        position: absolute;
        z-index: 1;
        left: 0;
        top: 0;
        box-sizing: border-box;
        outline: none;

        &.v1, &.v2 {
            border-bottom: solid 1px rgba(0, 0, 0, .25);
        }

        &.v1, &.v3 {
            border-right: solid 1px rgba(0, 0, 0, .25);
        }
    }

    &.quad-view {
        .view {
            width: calc(50% - 1px);
            height: calc(50% - 1px);
        }

        .v2 {
            left: calc(50% - 1px);
        }

        .v3 {
            top: calc(50% - 1px);
        }

        .v4 {
            left: calc(50% - 1px);
            top: calc(50% - 1px);
        }
    }

    &:not(.quad-view) {
        .view {
            width: 100%;
            height: 100%;
        }

        .v2, .v3, .v4 {
            width: 0;
            height: 0;
            display: none;
        }
    }
}
</style>
