<template>
    <div class="model-tree"
         @click.left.self="onSetSelection([])"
         @contextmenu.prevent
    >
        <model-tree-node v-for="node in model.nodes"
                         :key="node.id"
                         :model="model"
                         :node="node"
                         :depth="0"
                         @set-value="onSetValue"
                         @set-selection="onSetSelection"
                         :dragging-node="draggingNode"
                         :drag-over-node="dragOverNode"
                         :drop-position="dropPosition"
                         @drag-start="onDragStart"
                         @drag-over="onDragOver"
                         @contextmenu="onContextMenu"
        />

        <popup-menu ref="contextMenu">
            <popup-menu-item title="Focus" @click="onFocus"/>
            <popup-menu-item sep/>
            <popup-menu-item title="Cut" hotkey="Ctrl+X" @click="onCut"/>
            <popup-menu-item title="Copy" hotkey="Ctrl+C" @click="onCopy"/>
            <popup-menu-item title="Paste" hotkey="Ctrl+V" @click="onPaste"/>
        </popup-menu>
    </div>
</template>

<script src="./ModelTree.ts"></script>

<style lang="scss" scoped>
.model-tree {
    overflow: auto;
}
</style>
