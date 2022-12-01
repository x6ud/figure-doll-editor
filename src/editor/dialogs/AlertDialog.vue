<template>
    <popup-dialog modal
                  title="Message"
                  closable
                  v-model:visible="visible"
    >
        <div style="white-space: pre-wrap;">{{ content }}</div>
        <template #buttons>
            <button @click="ok">Ok</button>
        </template>
    </popup-dialog>
</template>

<script src="./AlertDialog.ts"></script>
