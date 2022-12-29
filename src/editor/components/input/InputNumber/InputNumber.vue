<template>
    <div class="input-number">
        <input type="text"
               :value="value"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onPost"
               @keydown.enter="onPost"
               ref="inputDom"
        >
        <button class="normal-button"
                v-if="resettable"
                @click="onReset"
        >
            <img src="../icons/reset.png" alt="">
        </button>
    </div>
</template>

<script src="./InputNumber.ts"></script>

<style lang="scss" scoped>
.input-number {
    display: inline-flex;

    & > * {
        &:not(:first-child) {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        &:not(:last-child) {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            margin-right: 1px;
        }
    }

    input {
        flex: 1 1;
        min-width: 0;
        min-height: 24px;
    }

    button {
        padding: 0;
    }
}
</style>
