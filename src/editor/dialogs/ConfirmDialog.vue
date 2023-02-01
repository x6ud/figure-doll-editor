<template>
    <popup-dialog modal
                  title="Confirm"
                  closable
                  v-model:visible="visible"
    >
        <div style="white-space: pre-wrap;">{{ content }}</div>
        <template #buttons>
            <button @click="yes">Yes</button>
            <button @click="no">No</button>
        </template>
    </popup-dialog>
</template>

<script src="./ConfirmDialog.ts"></script>