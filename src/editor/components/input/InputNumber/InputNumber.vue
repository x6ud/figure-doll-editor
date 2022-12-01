<template>
    <input class="input-number"
           type="text"
           :value="value"
           :readonly="readonly"
           :disabled="disabled"
           @input="onChange"
           @blur="onPost"
           @keydown.enter="onPost"
           ref="inputDom"
    >
</template>

<script src="./InputNumber.ts"></script>

<style lang="scss" scoped>
.input-number {
    min-height: 24px;
}
</style>
