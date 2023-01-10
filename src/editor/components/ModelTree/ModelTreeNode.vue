<template>
    <div class="model-tree-node"
         :class="classnames"
         @mousedown.left="onMouseDown"
         @mousemove="onMouseMove"
         @contextmenu.prevent="onContextMenu(node, $event)"
         ref="dom"
    >
        <div class="visibility">
            <div class="icon"
                 v-if="hasVisible"
                 :class="[visible ? 'visible' : 'invisible']"
                 @click.stop="toggleVisible"
            ></div>
        </div>
        <div class="name"
             :style="{'padding-left': `${depth * 16 + 2}px`}"
             @click="onNodeClick"
        >
            <div class="expand">
                <div class="icon"
                     v-if="node.children.length"
                     :class="[node.expanded ? 'collapse' : 'expand']"
                     @click.stop="toggleExpanded"
                ></div>
            </div>
            <img class="node-icon" :src="icon" alt="">
            <span>{{ name }}</span>
        </div>
    </div>
    <template v-if="node.expanded">
        <model-tree-node v-for="child in node.children"
                         :key="child.id"
                         :model="model"
                         :node="child"
                         :depth="depth + 1"
                         @set-value="onSetValue"
                         @set-selection="onSetSelection"
                         @range-select="onRangeSelect"
                         :dragging-node="draggingNode"
                         :drag-over-node="dragOverNode"
                         :drop-position="dropPosition"
                         @drag-start="onDragStart"
                         @drag-over="onDragOver"
                         @contextmenu="onContextMenu"
        />
    </template>
</template>

<script src="./ModelTreeNode.ts"></script>

<style lang="scss" scoped>
.model-tree-node {
    display: flex;
    align-items: center;
    font-size: 12px;
    user-select: none;
    transition: all .3s;
    border-bottom: solid 1px #555;
    position: relative;

    &:hover {
        background: #444;
    }

    &.selected {
        background: #666;
    }

    &.dragging {
        background: #666;
    }

    &.drag-over-inside {
        &:before {
            content: '';
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            border: solid 1px red;
            pointer-events: none;
        }
    }

    &.drag-over-before,
    &.drag-over-after {
        &::before {
            content: '';
            display: block;
            position: absolute;
            left: 0;
            right: 0;
            z-index: 1;
            height: 1px;
            background: red;
        }
    }

    &.drag-over-before::before {
        top: 0;
    }

    &.drag-over-after::before {
        bottom: 0;
    }

    &.instance {
        .node-icon, .name {
            opacity: .75;
        }
    }

    .icon {
        width: 24px;
        height: 24px;
        background-position: center center;
        background-repeat: no-repeat;

        &.collapse {
            background-image: url("./icons/collapse.png");
        }

        &.expand {
            background-image: url("./icons/expand.png");
        }

        &.invisible {
            background-image: url("./icons/invisible.png");
        }

        &.visible {
            background-image: url("./icons/visible.png");
        }
    }

    .visibility {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        border-right: solid 1px #555;
    }

    .node-icon {
        width: 24px;
        height: 24px;
        margin-left: -2px;
        pointer-events: none;
    }

    .name {
        display: flex;
        align-items: center;
        flex: 1 1;
        overflow: hidden;

        & > .expand {
            flex: 0 0 18px;
            width: 18px;
            height: 24px;

            .icon {
                width: 100%;
            }
        }
    }
}
</style>
