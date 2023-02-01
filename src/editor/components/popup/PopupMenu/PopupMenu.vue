<template>
    <button class="popup-menu-trigger"
            :class="className"
            :disabled="disabled"
            @mousedown.stop="onTriggerMouseDown"
            @mouseover="onTriggerMouseOver"
            ref="trigger"
            v-if="title"
    >
        {{ title }}
    </button>

    <teleport to="body">
        <div v-if="visible"
             class="popup-menu"
             :class="{scrollable}"
             :style="style"
             ref="menu"
             tabindex="0"
             @mousedown.stop
             @contextmenu.prevent
             @keydown="onKeyDown"
        >
            <div class="scroll">
                <slot/>
            </div>
        </div>
    </teleport>
</template>

<script src="./PopupMenu.ts"></script>

<style lang="scss" scoped>
.popup-menu {
    position: fixed;
    z-index: 1000;
    min-width: 130px;
    background: #666;
    border: solid 1px #444;
    color: #fff;
    font-size: 12px;
    user-select: none;
    outline: none;

    &.scrollable {
        .scroll {
            position: absolute;
            left: 0;
            top: 0;
            right: -8px;
            bottom: 0;
            overflow-y: scroll;
        }
    }
}
</style>
