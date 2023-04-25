<template>
    <div class="collapsible-panel">
        <div class="collapsible-panel__title cols">
            <div class="fill">
                <slot name="title"/>
            </div>
            <div class="collapse-button" @click="collapsed = !collapsed">
                <img src="./collapsed.png" alt="" v-if="collapsed">
                <img src="./expanded.png" alt="" v-else>
            </div>
        </div>
        <div class="collapsible-panel__body"
             :class="{collapsed}"
        >
            <slot name="body"/>
        </div>
    </div>
</template>

<script src="./CollapsiblePanel.ts"></script>

<style lang="scss" scoped>
.collapsible-panel {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    border: solid 1px #444;
    border-radius: 3px;

    .collapsible-panel__title {
        align-items: center;
        height: 32px;
        padding: 0 4px;

        .collapse-button {
            width: 24px;
            height: 24px;
            cursor: pointer;
        }
    }

    .collapsible-panel__body {
        padding: 0 4px 4px 4px;

        &.collapsed {
            max-height: 0;
            padding: 0;
            overflow: hidden;
        }
    }
}
</style>
