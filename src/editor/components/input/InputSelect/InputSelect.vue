<template>
    <select class="input-select"
            :value="value"
            :disabled="disabled"
            @change="onChange"
            ref="selectDom"
    >
        <option v-for="option in options"
                :key="option"
                :value="option"
        >
            {{ option }}
        </option>
    </select>
</template>

<script src="./InputSelect.ts"></script>

<style lang="scss" scoped>
.input-select {
    min-height: 24px;
}
</style>
