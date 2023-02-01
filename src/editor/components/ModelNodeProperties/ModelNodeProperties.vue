<template>
    <div class="properties"
         :key="key"
    >
        <template v-for="prop in properties">
            <div class="property" :class="{inline: prop.inlineLabel}">
                <label>{{ prop.label }}</label>
                <component class="value"
                           :is="prop.inputComponent"
                           :value="prop.value"
                           @input="onInput(prop.componentClass, $event)"
                           v-bind="prop.inputComponentProps"
                />
            </div>
        </template>
    </div>
</template>

<script src="./ModelNodeProperties.ts"></script>
