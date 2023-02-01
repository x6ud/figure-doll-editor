<template>
    <div class="input-double-range">
        <input-number :value="value[0]" @input="inputValue1"/>
        <div class="input-double-range__bar"
             tabindex="0"
             @keydown.left="moveLeft"
             @keydown.right="moveRight"
             @pointerdown="onPointerDown"
        >
            <div class="input-double-range__slider-container"
                 ref="bar"
            >
                <div class="input-double-range__slider-bar" :style="sliderBarStyle"></div>
                <div class="input-double-range__slider" :style="slider1Style"></div>
                <div class="input-double-range__slider" :style="slider2Style"></div>
            </div>
        </div>
        <input-number :value="value[1]" @input="inputValue2"/>
    </div>
</template>

<script lang="ts" src="./InputDoubleRange.ts"></script>

<style lang="scss" scoped>
.input-double-range {
    display: inline-flex;
    align-items: center;
    height: 24px;

    .input-double-range__bar {
        flex: 1 1;
        min-width: 0;
        height: 24px;
        padding: 0 2px;
        margin: 0 4px;
        background: #444;
        border-radius: 3px;
        overflow: hidden;
        outline: none !important;

        .input-double-range__slider-container {
            position: relative;
            width: 100%;
            height: 100%;

            .input-double-range__slider-bar {
                position: absolute;
                z-index: 1;
                top: 0;
                height: 100%;
                background: #555;

                &:hover {
                    background: #606060;
                }
            }

            .input-double-range__slider {
                position: absolute;
                z-index: 2;
                top: 0;
                width: 4px;
                height: 100%;
                margin-left: -2px;
                background: #666;

                &:hover {
                    background: #777;
                }
            }
        }
    }

    .input-number {
        flex: 0 0 3em;
        width: 3em;
        text-align: center;
    }
}
</style>
