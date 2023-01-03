<template>
    <div class="color-picker">
        <div class="hue-ring"
             @mousedown="onHueRingMouseDown"
             ref="hueRing"
        >
            <div class="hue-ring-handler"
                 :style="hueRingHandlerStyle"
            ></div>
            <div class="hue-ring-inner">
                <div class="sv-rect"
                     :style="svRectStyle"
                     @mousedown="onSvRectMouseDown"
                     ref="svRect"
                >
                    <div class="bg1 bg"></div>
                    <div class="bg2 bg"></div>
                    <div class="sv-rect-handler" :style="svRectHandlerStyle"></div>
                </div>
            </div>
        </div>

        <div class="color-value">
            <div class="block"
                 :style="{'background-color': `#${hex}`}"
            ></div>
            <span>#</span><input type="text" :value="hex" @input="onTextInput">
        </div>

        <div class="color-box">
            <div class="color"
                 v-for="(hex, i) in colorBoxHex"
                 :style="{'background-color': `#${hex}`}"
                 :class="{active: activeBox === i}"
                 @click="onBoxClick(i)"
            ></div>
        </div>
    </div>
</template>

<script src="./ColorPicker.ts"></script>

<style lang="scss" scoped>
.color-picker {
    width: 160px;

    .hue-ring {
        position: relative;
        box-sizing: border-box;
        width: 160px;
        height: 160px;
        margin-bottom: 8px;
        background: conic-gradient(
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%),
                hsl(60, 100%, 50%)
        );
        border-radius: 50%;
        border: solid 1px #000;

        .hue-ring-handler {
            position: absolute;
            z-index: 10;
            top: -1px;
            left: 50%;
            width: 1px;
            pointer-events: none;

            &:before {
                content: '';
                display: block;
                position: absolute;
                left: -7px;
                top: 0;
                width: 7px;
                height: 13px;
                border: solid 1px #000;
                box-shadow: inset 0 0 0 1px #fff;
            }
        }

        .hue-ring-inner {
            position: absolute;
            left: 13px;
            top: 13px;
            box-sizing: border-box;
            width: calc(100% - 13px * 2);
            height: calc(100% - 13px * 2);
            background: #666;
            border-radius: 50%;
            border: solid 1px #000;


            .sv-rect {
                position: absolute;
                left: 23px;
                top: 23px;
                box-sizing: border-box;
                width: calc(100% - 23px * 2);
                height: calc(100% - 23px * 2);
                border: solid 1px #000;

                .bg {
                    position: absolute;
                    left: 0;
                    top: 0;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                .bg1 {
                    background: linear-gradient(to right, #fff 0%, rgba(255, 255, 255, 0) 100%);
                }

                .bg2 {
                    background: linear-gradient(to bottom, transparent 0%, #000 100%);
                }

                .sv-rect-handler {
                    position: absolute;
                    z-index: 2;
                    pointer-events: none;

                    &:before {
                        content: '';
                        display: block;
                        width: 8px;
                        height: 8px;
                        margin: -5px 0 0 -5px;
                        border-radius: 50%;
                        border: solid 1px #000;
                        box-shadow: inset 0 0 0 1px #fff;
                    }
                }
            }
        }
    }

    .color-value {
        display: flex;
        align-items: center;
        margin-bottom: 8px;

        .block {
            box-sizing: border-box;
            width: 20px;
            height: 20px;
            margin-right: 4px;
            border: solid 1px #000;
        }

        input {
            flex: 1 1;
            min-width: 0;
            height: 20px;
            line-height: 20px;
        }
    }

    .color-box {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 4px;

        .color {
            flex: 0 0 18px;
            width: 18px;
            height: 18px;
            box-sizing: border-box;
            border: solid 1px #000;
            box-shadow: inset 0 0 0 1px #fff;

            &:not(:last-child) {
                margin-right: 2px;
            }

            &.active, &:hover {
                border-color: #fff;
                box-shadow: 0 0 0 1px #000;
            }
        }
    }
}
</style>
