<template>
    <div class="canvas-wrapper" ref="wrapper"
         :class="{'quad-view': quadView}"
    >
        <canvas ref="canvas"></canvas>
        <div class="view v1" ref="view1" tabindex="0"
             v-show="quadView || mainView === 0"
        >
            <div class="control" ref="view1Control"></div>
            <template v-if="editorContext">
                <view-rotation-handler :alpha="editorContext.views[0].camera.alpha"
                                       :beta="editorContext.views[0].camera.beta"
                                       @set-view="setView"
                />
            </template>
        </div>
        <div class="view v2" ref="view2" tabindex="0"
             v-show="quadView || mainView === 1"
        >
            <div class="control" ref="view2Control"></div>
            <template v-if="editorContext">
                <view-rotation-handler :alpha="editorContext.views[1].camera.alpha"
                                       :beta="editorContext.views[1].camera.beta"
                                       @set-view="setView"
                />
            </template>
        </div>
        <div class="view v3" ref="view3" tabindex="0"
             v-show="quadView || mainView === 2"
        >
            <div class="control" ref="view3Control"></div>
            <template v-if="editorContext">
                <view-rotation-handler :alpha="editorContext.views[2].camera.alpha"
                                       :beta="editorContext.views[2].camera.beta"
                                       @set-view="setView"
                />
            </template>
        </div>
        <div class="view v4" ref="view4" tabindex="0"
             v-show="quadView || mainView === 3"
        >
            <div class="control" ref="view4Control"></div>
            <template v-if="editorContext">
                <view-rotation-handler :alpha="editorContext.views[3].camera.alpha"
                                       :beta="editorContext.views[3].camera.beta"
                                       @set-view="setView"
                />
            </template>
        </div>
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
        z-index: 10;
        left: 0;
        top: 0;
        box-sizing: border-box;
        outline: none;
        user-select: none;
        touch-action: none;

        &.v1, &.v2 {
            border-bottom: solid 1px rgba(0, 0, 0, .25);
        }

        &.v1, &.v3 {
            border-right: solid 1px rgba(0, 0, 0, .25);
        }

        .control {
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        .view-rotation-handler {
            position: absolute;
            z-index: 2;
            top: 6px;
            right: 6px;
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
    }
}
</style>
