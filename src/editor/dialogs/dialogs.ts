import {createComponentInstance} from '../utils/component';
import ConfirmDialog from './ConfirmDialog.vue';
import PromptDialog from './PromptDialog.vue';

// =========================== confirm ===========================

export class ConfirmDialogContext {
    visible: boolean;
    content: string;
    onCloseCallback: (b: boolean) => void;

    constructor(visible: boolean, content: string, onCloseCallback: (b: boolean) => void) {
        this.visible = visible;
        this.content = content;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showConfirmDialog(content: string): Promise<boolean> {
    let unmount: () => void;
    return new Promise<boolean>(function (resolve) {
        const context = new ConfirmDialogContext(
            true,
            content,
            function (b) {
                unmount();
                resolve(b);
            }
        );
        unmount = createComponentInstance(ConfirmDialog, app => {
            app.provide('context', context);
        });
    });
}

// =========================== prompt ===========================

export class PromptDialogContext {
    visible: boolean;
    title: string;
    value: string | null;
    onCloseCallback: (val: string | null) => void;

    constructor(visible: boolean, title: string, value: string | null, onCloseCallback: (val: string | null) => void) {
        this.visible = visible;
        this.title = title;
        this.value = value;
        this.onCloseCallback = onCloseCallback;
    }
}

export function showPromptDialog(title: string, value?: string): Promise<string | null> {
    let unmount: () => void;
    return new Promise<string | null>(function (resolve) {
        const context = new PromptDialogContext(
            true,
            title,
            value == null ? null : value,
            function (val) {
                unmount();
                resolve(val);
            }
        );
        unmount = createComponentInstance(PromptDialog, app => {
            app.provide('context', context);
        });
    });
}
