<template>
    <div class="accordion-group">
        <slot/>
    </div>
</template>

<script src="./AccordionGroup.ts"></script>

<style lang="scss" scoped>
.accordion-group {
    width: 100%;

    &::v-deep .collapsible-panel:not(:last-child) {
        margin-bottom: 6px;
    }
}
</style>
