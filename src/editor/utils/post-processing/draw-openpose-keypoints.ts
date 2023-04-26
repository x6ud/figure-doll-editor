import {Camera, Object3D, Scene, Vector3} from 'three';
import COpenPoseRoot from '../../model/components/COpenPoseRoot';
import ModelNode from '../../model/ModelNode';
import {getTranslation} from '../math';

// modified from https://github.com/fkunn1326/openpose-editor/blob/master/javascript/main.js

const keypointNames = ['nose', 'neck', 'right_shoulder', 'right_elbow', 'right_wrist', 'left_shoulder', 'left_elbow',
    'left_wrist', 'right_hip', 'right_knee', 'right_ankle', 'left_hip', 'left_knee', 'left_ankle', 'right_eye',
    'left_eye', 'right_ear', 'left_ear'];
const connections = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [1, 11],
    [11, 12], [12, 13], [14, 0], [14, 16], [15, 0], [15, 17]];
const colors = [[0, 0, 255], [255, 0, 0], [255, 170, 0], [255, 255, 0], [255, 85, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0],
    [0, 255, 85], [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255], [85, 0, 255],
    [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85]];
const pointColors = colors.map(arr => `rgb(${arr[0]},${arr[1]},${arr[2]})`);
const lineColors = colors.map(arr => `rgba(${arr[0]},${arr[1]},${arr[2]},0.7)`);

const _mask = keypointNames.map(_ => false);
const _pos = keypointNames.map(_ => new Vector3());

export function drawOpenposeKeypoints(ctx: CanvasRenderingContext2D, scene: Scene, camera: Camera) {
    // find pose nodes
    const stack: Object3D[] = [...scene.children];
    const poseRoots: COpenPoseRoot[] = [];
    while (stack.length) {
        const obj = stack.pop();
        if (!obj) {
            break;
        }
        if (obj.visible) {
            const node = obj.userData.node as ModelNode | undefined;
            if (node) {
                if (node.has(COpenPoseRoot)) {
                    const cOpenPoseRoot = node.get(COpenPoseRoot);
                    if (cOpenPoseRoot.value) {
                        poseRoots.push(cOpenPoseRoot);
                    }
                }
            } else {
                stack.push(...obj.children);
            }
        }
    }

    // draw keypoints
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const wHalf = w / 2;
    const hHalf = h / 2;
    ctx.lineWidth = 10;
    for (let pose of poseRoots) {
        const len = keypointNames.length;
        for (let i = 0; i < len; ++i) {
            const name = keypointNames[i];
            const node = pose.keypoints[name];
            if (node) {
                _mask[i] = true;
                const pos = getTranslation(_pos[i], node.getWorldMatrix());
                pos.project(camera);
                pos.x = pos.x * wHalf + wHalf;
                pos.y = -pos.y * hHalf + hHalf;
            } else {
                _mask[i] = false;
            }
        }
        for (let i = 0, len = connections.length; i < len; ++i) {
            const conn = connections[i];
            const ia = conn[0];
            const ib = conn[1];
            if (_mask[ia] && _mask[ib]) {
                const a = _pos[ia];
                const b = _pos[ib];
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = lineColors[i];
                ctx.stroke();
            }
        }
        for (let i = 0; i < len; ++i) {
            if (_mask[i]) {
                const pos = _pos[i];
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = pointColors[i];
                ctx.fill();
            }
        }
    }
}
