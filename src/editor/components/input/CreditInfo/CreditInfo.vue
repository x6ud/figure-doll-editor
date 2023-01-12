<template>
    <div class="credit-info" v-if="value">
        This work is based on
        <a :href="value.url" target="_blank">{{ value.name }}</a>
        by <a :href="value.user.url" target="_blank">{{ value.user.name }}</a>
        licensed under <a :href="value.license.url" target="_blank">{{ value.license.name }}</a>.
    </div>
</template>

<script src="./CreditInfo.ts"></script>

<style lang="scss" scoped>
.credit-info {
    line-height: 1.5em;
    font-style: italic;

    a {
        color: #fff;
    }
}
</style>
