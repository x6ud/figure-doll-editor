<template>
    <div class="label-range"
         @pointerdown="onMouseDown"
         ref="dom"
    >
        <div class="bar" :style="barStyle"></div>
        <div class="label">{{ label }}</div>
        <div class="value">{{ valueText }}</div>
    </div>
</template>

<script src="./LabelRange.ts"></script>

<style lang="scss" scoped>
.label-range {
    display: flex;
    align-items: center;
    position: relative;
    width: 150px;
    height: 18px;
    border-radius: 3px;
    box-sizing: border-box;
    font-size: 8px;
    background: #444;
    overflow: hidden;
    touch-action: none;

    &:hover {
        background-color: #555;
    }

    .bar {
        position: absolute;
        z-index: 1;
        height: 100%;
        left: 0;
        top: 0;
        background: #3390ff;
    }

    .label {
        position: relative;
        z-index: 2;
        flex: 1 1;
        min-width: 0;
        padding: 0 8px;
    }

    .value {
        position: relative;
        z-index: 2;
        padding-right: 8px;
    }
}
</style>
