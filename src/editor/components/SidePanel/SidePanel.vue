<template>
    <div class="side-panel"
         :style="{width: `${width}px`}"
    >
        <div class="side-panel-content">
            <slot></slot>
        </div>
        <div class="resizer-handler left"
             v-if="direction === 'left'"
             @pointerdown="onResize"
        ></div>
        <div class="resizer-handler right"
             v-if="direction === 'right'"
             @pointerdown="onResize"
        ></div>
    </div>
</template>

<script src="./SidePanel.ts"></script>

<style lang="scss" scoped>
.side-panel {
    position: relative;
    box-sizing: border-box;
    border: solid 1px #555;
    background: #333;

    .side-panel-content {
        width: 100%;
        height: 100%;
        overflow: auto;
    }

    .resizer-handler {
        position: absolute;
        z-index: 2;
        width: 5px;
        top: 0;
        bottom: 0;
        cursor: ew-resize;
        touch-action: none;

        &.left {
            left: -2px;
        }

        &.right {
            right: -2px;
        }
    }
}
</style>
