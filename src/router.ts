import {createRouter, createWebHashHistory} from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import('./editor/Editor.vue')
        },
        {
            path: '/testbed',
            component: () => import('./testbed/Testbed.vue')
        },
    ]
});

export default router;
