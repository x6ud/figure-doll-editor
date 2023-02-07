<template>
    <div class="model-tree"
         @click.left.self="onSetSelection([])"
         @contextmenu.self.prevent="onContextMenu(undefined, $event)"
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
                         @range-select="onRangeSelect"
        />

        <popup-menu ref="contextMenu">
            <popup-menu-item title="Focus" @click="onFocus"
                             :disabled="!contextMenuNode"
            />
            <template v-if="canFlip">
                <popup-menu-item title="Flip" @click="onFlip('flip')"/>
                <popup-menu-item title="Flip Left to Right" @click="onFlip('left-to-right')"/>
                <popup-menu-item title="Flip Right to Left" @click="onFlip('right-to-left')"/>
            </template>
            <template v-if="canConvertToClay || canApplyTransformation || canCreateInstance">
                <popup-menu-item sep/>
                <template v-if="canConvertToClay">
                    <popup-menu-item title="Convert to Clay" @click="onConvertToClay"/>
                </template>
                <template v-if="canApplyTransformation">
                    <popup-menu-item title="Apply Transformation" @click="onApplyTransformation"/>
                </template>
                <template v-if="canCreateInstance">
                    <popup-menu-item title="Create Shadow Node" @click="onCreateInstance('none')"/>
                    <popup-menu-item title="Create Mirroring Shadow Node" @click="onCreateInstance('z')"/>
                    <popup-menu-item title="Create Vertical Mirroring Shadow Node" @click="onCreateInstance('y')"/>
                </template>
            </template>
            <template v-if="hasPose">
                <popup-menu-item sep/>
                <popup-menu-item title="Copy Pose" @click="onCopyPose"/>
                <popup-menu-item title="Paste Pose" @click="onPastePose"/>
            </template>
            <popup-menu-item sep/>
            <popup-menu-item title="Cut" hotkey="Ctrl+X" @click="onCut"
                             :disabled="!model.selected.length"
            />
            <popup-menu-item title="Copy" hotkey="Ctrl+C" @click="onCopy"
                             :disabled="!model.selected.length"
            />
            <popup-menu-item title="Paste" hotkey="Ctrl+V" @click="onPaste"/>
            <popup-menu-item title="Delete" hotkey="Delete" @click="onDelete"
                             :disabled="!model.selected.length"
            />
        </popup-menu>
    </div>
</template>

<script src="./ModelTree.ts"></script>

<style lang="scss" scoped>
.model-tree {
    overflow: auto;
}
</style>
