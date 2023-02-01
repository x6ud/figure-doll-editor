<template>
    <input class="input-string"
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

<script src="./InputString.ts"></script>

<style lang="scss" scoped>
.input-string {
    min-height: 24px;
}
</style>
