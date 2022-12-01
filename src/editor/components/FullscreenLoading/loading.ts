import {createComponentInstance} from '../../utils/component';
import FullscreenLoading from './FullscreenLoading.vue';

let unmount: (() => void) | null = null;

export function showFullscreenLoading() {
    if (unmount) {
        return;
    }
    unmount = createComponentInstance(FullscreenLoading);
}

export function hideFullscreenLoading() {
    if (unmount) {
        unmount();
    }
}
