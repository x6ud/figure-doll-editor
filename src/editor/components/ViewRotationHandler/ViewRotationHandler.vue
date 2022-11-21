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
            border: solid 1px #989898;
            background-color: rgba(0, 0, 0, .8);
            color: #fff;
            font-size: 8px;
            cursor: pointer;
            transition: all .1s;

            &.front {
                transform: rotateY(0) translateZ(12px);
            }

            &.right {
                transform: rotateY(90deg) translateZ(12px);
            }

            &.back {
                transform: rotateY(180deg) translateZ(12px);
            }

            &.left {
                transform: rotateY(-90deg) translateZ(12px);
            }

            &.top {
                transform: rotateX(90deg) translateZ(12px);
            }

            &.bottom {
                transform: rotateX(-90deg) translateZ(12px);
            }

            &:hover {
                background-color: #3390ff;
            }
        }
    }
}
</style>
