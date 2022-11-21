<template>
    <teleport to="body">
        <div class="popup-dialog__mask"
             :class="{modal, visible}"
        >
            <div class="popup-dialog"
                 :style="style"
                 ref="dialog"
            >
                <div class="popup-dialog__title"
                     @mousedown="onTitleMouseDown"
                >
                    <div class="popup-dialog__title-text">{{ title }}</div>
                    <button class="popup-dialog__btn-close"
                            v-if="closable"
                            @mousedown.stop
                            @click="close"
                    ></button>
                </div>
                <div class="popup-dialog__body">
                    <slot/>
                </div>
                <div class="popup-dialog__buttons"
                     v-if="$slots.buttons"
                >
                    <slot name="buttons"/>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script src="./PopupDialog.ts"></script>

<style lang="scss" scoped>
.popup-dialog__mask {
    display: none;

    &.visible {
        display: block;
    }

    &.modal {
        position: fixed;
        z-index: 2000;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
    }

    & > .popup-dialog {
        position: fixed;
        display: flex;
        flex-direction: column;
        background: #666;
        border: solid 1px #444;
        box-shadow: 0 0 5px rgba(0, 0, 0, .2);
        font-size: 14px;
        color: #fff;
        user-select: none;

        & > .popup-dialog__title {
            display: flex;
            align-items: center;
            background: #444;
            padding: 4px 4px 4px 12px;

            .popup-dialog__title-text {
                flex: 1 1;
            }

            .popup-dialog__btn-close {
                width: 24px;
                height: 24px;
                line-height: 24px;
                padding: 0;
                margin: 0 0 0 4px;
                border: none;
                background: transparent;
                color: #fff;
                outline: none;
                transition: background-color .3s;

                &:before {
                    content: '×';
                    font-size: 20px;
                }

                &:hover {
                    background-color: #555;
                }

                &:active {
                    background-color: #333;
                }
            }
        }

        & > .popup-dialog__body {
            padding: 6px 12px;
            min-width: 320px;
            box-sizing: border-box;
        }

        & > .popup-dialog__buttons {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 6px 12px 12px 12px;

            &:deep(button) {
                box-sizing: border-box;
                padding: 4px 12px;
                border: none;
                background: #444;
                color: #fff;
                font-size: 14px;
                outline: none;
                transition: background-color .3s;

                &:not(:last-child) {
                    margin-right: 8px;
                }

                &:hover {
                    background-color: #555;
                }

                &:active {
                    background-color: #222;
                }
            }
        }
    }
}
</style>
