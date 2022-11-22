<template>
    <div class="horizontal-splitter"
    >
        <div class="resizer-handler"
             :class="{fixed}"
             @mousedown="onMouseDown"
        ></div>
    </div>
</template>

<script src="./HorizontalSplitter.ts"></script>

<style lang="scss" scoped>
.horizontal-splitter {
    position: relative;
    width: 1px;
    height: 100%;
    background-color: #555;

    .resizer-handler {
        position: absolute;
        left: -2px;
        right: -2px;
        top: 0;
        bottom: 0;
        cursor: ew-resize;

        &.fixed {
            cursor: default;
        }
    }
}
</style>
