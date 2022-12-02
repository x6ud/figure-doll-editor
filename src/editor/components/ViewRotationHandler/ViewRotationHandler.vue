<template>
    <div class="view-rotation-handler"
         @contextmenu.prevent
    >
        <div class="cube"
             :style="cubeStyle"
        >
            <div class="face front" @click="setView('front')">+Z</div>
            <div class="face back" @click="setView('back')">-Z</div>
            <div class="face top" @click="setView('top')">+Y</div>
            <div class="face bottom" @click="setView('bottom')">-Y</div>
            <div class="face right" @click="setView('right')">+X</div>
            <div class="face left" @click="setView('left')">-X</div>
        </div>
    </div>
</template>

<script src="./ViewRotationHandler.ts"></script>

<style lang="scss" scoped>
.view-rotation-handler {
    user-select: none;
    perspective: 100px;

    .cube {
        position: relative;
        transform-style: preserve-3d;
        width: 24px;
        height: 24px;

        .face {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            box-sizing: border-box;
            border: solid 1px;
            background-color: rgba(0, 0, 0, .8);
            font-size: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all .1s;

            &.front {
                transform: rotateY(0) translateZ(12px);
                color: #2F83E3;
                border-color: #2F83E3;
            }

            &.back {
                transform: rotateY(180deg) translateZ(12px);
                color: #2F83E3;
                border-color: #2F83E3;
            }

            &.right {
                transform: rotateY(90deg) translateZ(12px);
                color: #F63652;
                border-color: #F63652;
            }

            &.left {
                transform: rotateY(-90deg) translateZ(12px);
                color: #F63652;
                border-color: #F63652;
            }

            &.top {
                transform: rotateX(90deg) translateZ(12px);
                color: #6FA51B;
                border-color: #6FA51B;
            }

            &.bottom {
                transform: rotateX(-90deg) translateZ(12px);
                color: #6FA51B;
                border-color: #6FA51B;
            }

            &:hover {
                background-color: #3390ff;
                color: #fff;
                border-color: #3390ff;
            }
        }
    }
}
</style>
