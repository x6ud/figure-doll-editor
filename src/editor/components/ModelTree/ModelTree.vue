<template>
    <div class="model-tree"
         @click.self="onSetSelection([])"
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
        />
    </div>
</template>

<script src="./ModelTree.ts"></script>

<style lang="scss" scoped>
.model-tree {
    overflow: auto;
}
</style>
