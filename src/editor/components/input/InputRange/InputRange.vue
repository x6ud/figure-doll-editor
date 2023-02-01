<template>
    <div class="input-range">
        <input class="range" type="range"
               :value="iValue"
               :min="iMin"
               :max="iMax"
               @input="onRangeInput"
        >
        <input class="num" type="text"
               :value="text"
               @input="onChange"
               @blur="onPost"
               @keydown.enter="onPost"
               ref="inputDom"
        >
    </div>
</template>

<script src="./InputRange.ts"></script>

<style lang="scss" scoped>
.input-range {
    display: flex;
    align-items: center;

    input {
        min-width: 0;
    }

    .range {
        flex: 1 1;
    }

    .num {
        width: 4em;
    }
}
</style>
