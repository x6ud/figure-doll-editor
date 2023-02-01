import {createRouter, createWebHashHistory} from 'vue-router';
import Editor from './editor/Editor.vue';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/:pathMatch(.*)',
            component: Editor
        }
    ]
});

export default router;
