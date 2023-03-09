import {Component, computed, defineComponent} from 'vue';
import Class from '../../type/Class';
import EditorContext from '../../EditorContext';
import ModelNodeComponent from '../../model/ModelNodeComponent';
import {getModelNodeComponentDef} from '../../model/ModelNodeComponentDef';
import {getModelNodeDef} from '../../model/ModelNodeDef';

export default defineComponent({
    props: {
        editorContext: {type: EditorContext, required: true}
    },
    emits: ['setData'],
    setup(props, ctx) {
        const key = computed(function () {
            return props.editorContext.model.selected.join(',');
        });

        type NodeProperty = {
            name: string,
            componentClass: Class<ModelNodeComponent<any>>,
            label: string,
            inlineLabel: boolean,
            inputComponent: Component,
            inputComponentProps: any,
            value: any,
        };

        const properties = computed<NodeProperty[]>(function () {
            const nodes = props.editorContext.model.getSelectedNodes();
            if (!nodes.length) {
                return [];
            }
            const ret: NodeProperty[] = [];
            const sharedProps = new Set<string>();
            let node = nodes[0];
            const nodeDef = getModelNodeDef(node.type);
            for (let componentClass of nodeDef.components) {
                const componentDef = getModelNodeComponentDef(componentClass.name);
                if (componentDef.inputComponent) {
                    sharedProps.add(componentClass.name);
                }
            }
            for (let i = 1, len = nodes.length; i < len; ++i) {
                let node = nodes[i];
                const nodeDef = getModelNodeDef(node.type);
                const properties = new Set<string>();
                for (let componentClass of nodeDef.components) {
                    const componentDef = getModelNodeComponentDef(componentClass.name);
                    if (componentDef.inputComponent) {
                        properties.add(componentClass.name);
                    }
                }
                for (let name of sharedProps) {
                    if (!properties.has(name)) {
                        sharedProps.delete(name);
                    }
                }
            }
            for (let name of sharedProps) {
                const componentDef = getModelNodeComponentDef(name);
                let value: any;
                if (node.instanceId && !componentDef.instanceable) {
                    value = props.editorContext.model.getNode(node.instanceId).value(componentDef.constructor);
                } else {
                    value = node.value(componentDef.constructor);
                }
                ret.push({
                    name,
                    componentClass: componentDef.constructor,
                    label: componentDef.label || name,
                    inlineLabel: componentDef.inlineLabel || false,
                    inputComponent: componentDef.inputComponent!,
                    inputComponentProps: componentDef.inputComponentProps,
                    value: value,
                });
            }
            return ret;
        });

        function onInput(type: Class<ModelNodeComponent<any>>, value: any) {
            ctx.emit('setData', props.editorContext.model.getSelectedNodes().map(node => ({
                node, type, value
            })));
        }

        return {
            key,
            properties,
            onInput,
        };
    }
});
