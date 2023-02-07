import {Euler} from 'three';
import EditorContext from '../EditorContext';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import ModelNode from '../model/ModelNode';

type PoseJson = {
    type: string,
    euler?: { x: number, y: number, z: number },
    children: PoseJson[],
};

export async function copyPose(node: ModelNode) {
    function getPoseJson(node: ModelNode) {
        const json: PoseJson = {
            type: node.type,
            children: [],
        };
        if (node.has(CIkNodeRotation)) {
            const euler = node.value(CIkNodeRotation);
            json.euler = {x: euler.x, y: euler.y, z: euler.z};
        }
        json.children = node.children.map(getPoseJson);
        return json;
    }

    await navigator.clipboard.writeText(JSON.stringify(getPoseJson(node)));
}

export async function pastePose(ctx: EditorContext, node: ModelNode) {
    try {
        let json = JSON.parse(await navigator.clipboard.readText()) as PoseJson;
        if (!('type' in json)) {
            return;
        }

        function applyPose(node: ModelNode, json: PoseJson) {
            if (json.type !== node.type) {
                return;
            }
            if (json.euler && node.has(CIkNodeRotation)) {
                ctx.history.setValue(node, CIkNodeRotation, new Euler(json.euler.x, json.euler.y, json.euler.z));
            }
            if (node.children.length === json.children.length) {
                for (let i = 0, len = node.children.length; i < len; ++i) {
                    applyPose(node.children[i], json.children[i]);
                }
            }
        }

        applyPose(node, json);
    } catch (e) {
        console.error(e);
    }
}
