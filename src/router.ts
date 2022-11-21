import {createRouter, createWebHashHistory} from 'vue-router';

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/editor',
        },
        {
            path: '/editor',
            component: () => import('./editor/Editor.vue')
        },
        {
            path: '/testbed',
            component: () => import('./testbed/Testbed.vue')
        },
    ]
});

export default router;
