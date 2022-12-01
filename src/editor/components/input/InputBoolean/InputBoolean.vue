<template>
    <div class="input-boolean"
         :class="{checked: !!value}"
         @click="flip"
    ></div>
</template>

<script src="./InputBoolean.ts"></script>

<style lang="scss" scoped>
.input-boolean {
    flex: 0 0 24px !important;
    display: inline-block;
    width: 24px;
    height: 24px;
    border-radius: 3px;
    overflow: hidden;
    background: #444;

    &:hover {
        background: #555;
    }

    &:active {
        background: #333;
    }

    &.checked::before {
        content: '';
        display: block;
        width: 24px;
        height: 24px;
        background: url("./checked.png") no-repeat;
    }
}
</style>