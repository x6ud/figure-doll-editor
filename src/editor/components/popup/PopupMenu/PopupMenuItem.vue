<template>
    <div class="popup-menu-item"
         ref="menuItem"
         @mouseover.stop="onMouseOver"
         :class="{'has-child': hasChild, disabled, sep, popup}"
         @click="onClick"
    >
        <template v-if="!sep">
            <div class="icon" :class="{checked, img: !!icon}">
                <template v-if="icon && !checked">
                    <img :src="icon" alt="">
                </template>
            </div>
            <div class="title">{{ title }}</div>
            <div class="hotkey" v-if="hotkey">{{ hotkey }}</div>
            <slot/>
        </template>
    </div>
</template>

<script src="./PopupMenuItem.ts"></script>

<style lang="scss" scoped>
.popup-menu-item {
    display: flex;
    align-items: center;
    position: relative;
    padding: 0 1em 0 0;
    transition: background-color .3s;
    white-space: nowrap;

    .icon {
        width: 24px;
        height: 24px;

        &.checked {
            background: url("./checked.png") center center no-repeat;
        }

        &.img {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .title {
        flex: 1 1;
    }

    .hotkey {
        margin-left: 1em;
    }

    &:hover {
        background-color: #777;
    }

    &.disabled {
        background: transparent !important;
        opacity: .5;
    }

    &.sep {
        height: 1px;
        background: #fff !important;
        padding: 0 !important;
        margin: 2px 0;
        opacity: .1;
    }

    &.has-child:after {
        content: '';
        display: block;
        position: absolute;
        z-index: 1;
        top: 50%;
        right: 8px;
        margin-top: -3px;
        border-top: solid 3px transparent;
        border-bottom: solid 3px transparent;
        border-left: solid 4px #fff;
    }

    &.popup {
        & > .title:after {
            content: '…';
        }
    }
}
</style>
