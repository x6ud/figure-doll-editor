import {reactive} from 'vue';

// https://sketchfab.com/developers/oauth
const CLIENT_ID = 'gYxItIxQuvELUDHlN23TLnKHSMC47FjIJmWce1uK';
const LOGIN_URL = `https://sketchfab.com/oauth2/authorize/?response_type=token&client_id=${CLIENT_ID}`;

const localStorageKey = 'sketchfab-token';

const sketchfabClient = reactive({
    token: {
        accessToken: '',
        expires: 0,
    },
    user: {
        displayName: '',
        username: '',
    },
    loadLocalStorage() {
        const json = localStorage.getItem(localStorageKey);
        if (!json) {
            return;
        }
        const token = JSON.parse(json);
        if (token.expires > Date.now()) {
            this.token = token;
            this.getUser();
        }
    },
    login() {
        window.location.replace(LOGIN_URL);
    },
    logout() {
        this.token = {
            accessToken: '',
            expires: 0,
        };
        localStorage.removeItem(localStorageKey);
    },
    parseRouterPath(path: string) {
        path = path || '';
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        const strArr = path.split('&');
        const params = {
            accessToken: '',
            expires: 0,
        };
        for (let str of strArr) {
            const pair = str.split('=');
            if (pair.length < 2) {
                continue;
            }
            const key = pair[0];
            const val = pair[1];
            switch (key) {
                case 'access_token':
                    params.accessToken = val;
                    break;
                case 'expires_in':
                    params.expires = Number.parseInt(val) * 1000 + Date.now();
                    break;
            }
        }
        if (params.accessToken && params.accessToken !== this.token.accessToken) {
            this.token = params;
            localStorage.setItem(localStorageKey, JSON.stringify(params));
            this.getUser();
        }
    },
    async fetch(url: string, method: string = 'get') {
        return fetch(url, {
            method,
            headers: {Authorization: `Bearer ${this.token.accessToken}`},
            mode: 'cors',
        });
    },
    async getUser() {
        const res = await this.fetch('https://api.sketchfab.com/v3/me');
        this.user = await res.json();
    },
    async getModelDownloadUrl(url: string) {
        const arr = new URL(url).pathname.split('-');
        const modelId = arr[arr.length - 1];
        if (!modelId) {
            return;
        }
        const download = await (
            await this.fetch(`https://api.sketchfab.com/v3/models/${modelId}/download`)
        ).json() as {
            glb?: { url: string, size: number, expires: number },
            gltf?: { url: string, size: number, expires: number },
            detail?: string,
        };
        const info = await (
            await this.fetch(`https://api.sketchfab.com/v3/models/${modelId}`)
        ).json() as {
            license: {
                fullName: string,
                label: string,
                requirements: string,
                slug: string,
                uri: string,
                url: string,
            },
            name: string,
            user: {
                username: string,
                displayName: string,
                profileUrl: string,
            },
            viewerUrl: string,
        };
        return {
            download,
            info: {
                name: info?.name,
                url: info?.viewerUrl,
                license: {
                    name: info?.license?.label,
                    url: info?.license?.url,
                },
                user: {
                    name: info?.user?.displayName,
                    url: info?.user?.profileUrl,
                },
            },
        };
    }
});

sketchfabClient.loadLocalStorage();

export function useSketchfabClient() {
    return sketchfabClient;
}
