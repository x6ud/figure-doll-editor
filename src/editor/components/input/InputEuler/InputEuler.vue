<template>
    <div class="input-euler">
        <input type="text"
               placeholder="x"
               :value="format(value.x)"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onPost"
               @keydown.enter="onPost"
               ref="input0"
        />
        <input type="text"
               placeholder="y"
               :value="format(value.y)"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onPost"
               @keydown.enter="onPost"
               ref="input1"
        />
        <input type="text"
               placeholder="z"
               :value="format(value.z)"
               :readonly="readonly"
               :disabled="disabled"
               @input="onChange"
               @blur="onPost"
               @keydown.enter="onPost"
               ref="input2"
        />
        <button class="normal-button"
                v-if="resettable"
                @click="onReset"
        >
            <img src="../icons/reset.png" alt="">
        </button>
    </div>
</template>

<script src="./InputEuler.ts"></script>

<style lang="scss" scoped>
.input-euler {
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
