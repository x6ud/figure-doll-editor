<template>
    <div>
        <label class="input-file normal-button">
            <input type="file"
                   ref="input"
                   @change="onChange"
                   :accept="accept"
            >
            ...
        </label>
    </div>
</template>

<script src="./InputFileAsArrayBuffer.ts"></script>

<style lang="scss" scoped>
.input-file {
    display: inline-block;
    margin: 0;

    input[type="file"] {
        display: none;
    }
}
</style>
