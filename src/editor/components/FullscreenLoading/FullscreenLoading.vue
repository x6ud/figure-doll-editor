<template>
    <teleport to="body">
        <div class="fullscreen-loading">
            <div class="lds-dual-ring"></div>
        </div>
    </teleport>
</template>

<style lang="scss" scoped>
.fullscreen-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: fixed;
    z-index: 3000;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;

    .lds-dual-ring {
        display: inline-block;
        width: 80px;
        height: 80px;
    }

    .lds-dual-ring:after {
        content: " ";
        display: block;
        width: 64px;
        height: 64px;
        margin: 8px;
        border-radius: 50%;
        border: 6px solid #fff;
        border-color: #fff transparent #fff transparent;
        animation: lds-dual-ring 1.2s linear infinite;
    }

    @keyframes lds-dual-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
}
</style>
