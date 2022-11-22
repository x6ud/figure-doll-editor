<template>
    <div class="vertical-splitter"
    >
        <div class="resizer-handler"
             :class="{fixed}"
             @mousedown="onMouseDown"
        ></div>
    </div>
</template>

<script src="./VerticalSplitter.ts"></script>

<style lang="scss" scoped>
.vertical-splitter {
    position: relative;
    width: 100%;
    height: 1px;
    background-color: #555;

    .resizer-handler {
        position: absolute;
        left: 0;
        right: 0;
        top: -2px;
        bottom: -2px;
        cursor: ns-resize;

        &.fixed {
            cursor: default;
        }
    }
}
</style>
