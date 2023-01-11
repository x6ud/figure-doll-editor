<template>
    <div class="input-color"
         :style="style"
    >
        <popup-menu title=" ">
            <div style="padding: 8px 8px 0 8px;">
                <color-picker :value="value"
                              @update:value="onInput"
                />
            </div>
        </popup-menu>
    </div>
</template>

<script src="./InputColor.ts"></script>

<style lang="scss" scoped>
.input-color {
    box-sizing: border-box;
    min-width: 48px;
    max-width: 48px;
    min-height: 24px;
    max-height: 24px;
    border-radius: 3px;
    border: solid 4px #444;
    overflow: hidden;

    &:hover {
        border-color: #555;
    }

    &:active {
        border-color: #222;
    }

    &::v-deep(.popup-menu-trigger) {
        width: 100%;
        height: 100%;
        min-height: 24px;
        padding: 0;
        margin: 0;
        border: none;
        background: transparent !important;
    }
}
</style>
