<template>
    <popup-dialog modal
                  :title="title"
                  closable
                  v-model:visible="visible"
    >
        <input type="text" v-model="value" style="width: 100%"
               ref="input"
        >
        <template #buttons>
            <button @click="ok">Ok</button>
            <button @click="cancel">Cancel</button>
        </template>
    </popup-dialog>
</template>

<script src="./PromptDialog.ts"></script>