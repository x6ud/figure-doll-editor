import {Euler, Matrix4, Quaternion, Vector3} from 'three';
import {toRaw} from 'vue';
import EditorContext from '../EditorContext';
import CFlipDirection from '../model/components/CFlipDirection';
import CIkNode from '../model/components/CIkNode';
import CIkNodeRotation from '../model/components/CIkNodeRotation';
import COpenPoseKeypoint from '../model/components/COpenPoseKeypoint';
import CPosition from '../model/components/CPosition';
import CRotation from '../model/components/CRotation';
import CScale from '../model/components/CScale';
import {ModelNodeCreationInfo} from '../model/ModelHistory';
import ModelNode from '../model/ModelNode';
import {getModelNodeDef} from '../model/ModelNodeDef';
import {getAxisAngle, vectorsEqual} from '../utils/math';

export function createInstanceNode(ctx: EditorContext, node: ModelNode, mirror: 'none' | 'x' | 'y' | 'z') {
    node = toRaw(node);

    const baseMat = new Matrix4();
    const invBaseMat = new Matrix4();
    const flipDir = new Vector3();
    const flipDirWorld = new Vector3();
    const flipOriginWorld = new Vector3();
    if (mirror !== 'none') {
        baseMat.copy(node.getParentWorldMatrix());
        invBaseMat.copy(baseMat).invert();
        switch (mirror) {
            case 'x':
                flipDir.set(1, 0, 0);
                break;
            case 'y':
                flipDir.set(0, 1, 0);
                break;
            case 'z':
                flipDir.set(0, 0, 1);
                break;
        }
        flipDirWorld.copy(flipDir).transformDirection(baseMat);
        flipOriginWorld.applyMatrix4(baseMat);
    }

    const _localTranslation1 = new Vector3();
    const _localRotation1 = new Quaternion();
    const _localScale1 = new Vector3();
    const _localMat1 = new Matrix4();
    const _axis = new Vector3();
    const _ikNodeQuat = new Quaternion();

    function makeNewNode(
        node: ModelNode,
        parentMat0?: Matrix4,
        parentMat1?: Matrix4,
        invParentMat1?: Matrix4,
        prevInvQuat1?: Quaternion,
    ) {
        const newNode: ModelNodeCreationInfo = {
            type: node.type,
            instanceId: node.instanceId || node.id,
        };
        newNode.data = node.getComponentData(true);
        let invQuat1: Quaternion | undefined = undefined;
        if (mirror !== 'none') {
            parentMat0 = parentMat0!;
            parentMat1 = parentMat1!;
            invParentMat1 = invParentMat1!;
            if (node.instanceId && node.has(CFlipDirection) && vectorsEqual(node.value(CFlipDirection), flipDir)) {
                delete newNode.data[CFlipDirection.name];
            } else {
                newNode.data[CFlipDirection.name] = new Vector3().copy(flipDir);
            }
            _localTranslation1.set(0, 0, 0);
            _localRotation1.set(0, 0, 0, 1);
            _localScale1.set(1, 1, 1);
            if (node.has(CPosition)) {
                const position = newNode.data[CPosition.name] as Vector3;
                position.applyMatrix4(parentMat0);
                position.sub(flipOriginWorld);
                position.reflect(flipDirWorld);
                position.add(flipOriginWorld);
                position.applyMatrix4(invParentMat1);
                _localTranslation1.copy(position);
            }
            if (node.has(CRotation)) {
                const rotation = newNode.data[CRotation.name] as Euler;
                _localRotation1.setFromEuler(rotation);
                const angle = getAxisAngle(_axis, _localRotation1);
                _axis.applyMatrix4(parentMat0);
                _axis.sub(flipOriginWorld);
                _axis.reflect(flipDirWorld);
                _axis.add(flipOriginWorld);
                _axis.applyMatrix4(invParentMat1);
                _axis.normalize();
                _localRotation1.setFromAxisAngle(_axis, -angle);
                rotation.setFromQuaternion(_localRotation1);
            }
            if (node.has(CIkNode)) {
                if (mirror === 'x') {
                    throw new Error('Flipping on x axis will broke the ik chain');
                }

                const cIkNode = node.get(CIkNode);

                _localTranslation1.copy(cIkNode.start);
                _localTranslation1.applyMatrix4(parentMat0);
                _localTranslation1.sub(flipOriginWorld);
                _localTranslation1.reflect(flipDirWorld);
                _localTranslation1.add(flipOriginWorld);
                _localTranslation1.applyMatrix4(invParentMat1);

                let angle = getAxisAngle(_axis, cIkNode.quaternion);
                _axis.applyMatrix4(parentMat0);
                _axis.sub(flipOriginWorld);
                _axis.reflect(flipDirWorld);
                _axis.add(flipOriginWorld);
                _axis.applyMatrix4(invParentMat1);
                _axis.normalize();
                _localRotation1.setFromAxisAngle(_axis, -angle);

                const ikNodeRotation = newNode.data[CIkNodeRotation.name] as Euler;
                if (prevInvQuat1) {
                    _ikNodeQuat.multiplyQuaternions(prevInvQuat1, _localRotation1);
                    ikNodeRotation.setFromQuaternion(_ikNodeQuat);
                } else {
                    ikNodeRotation.setFromQuaternion(_localRotation1);
                }
            }
            if (node.has(CScale)) {
                _localScale1.setScalar(node.value(CScale));
            }
            if (node.has(COpenPoseKeypoint)) {
                const type = node.value(COpenPoseKeypoint);
                newNode.data[COpenPoseKeypoint.name] = {
                    '': '',
                    'nose': 'nose',
                    'neck': 'neck',
                    'right_shoulder': 'left_shoulder',
                    'right_elbow': 'left_elbow',
                    'right_wrist': 'left_wrist',
                    'left_shoulder': 'right_shoulder',
                    'left_elbow': 'right_elbow',
                    'left_wrist': 'right_wrist',
                    'right_hip': 'left_hip',
                    'right_knee': 'left_knee',
                    'right_ankle': 'left_ankle',
                    'left_hip': 'right_hip',
                    'left_knee': 'right_knee',
                    'left_ankle': 'right_ankle',
                    'right_eye': 'left_eye',
                    'left_eye': 'right_eye',
                    'right_ear': 'left_ear',
                    'left_ear': 'right_ear',
                }[type];
            }
            _localMat1.compose(_localTranslation1, _localRotation1, _localScale1);
            parentMat1 = new Matrix4().multiplyMatrices(parentMat1, _localMat1);
            invParentMat1 = new Matrix4().copy(parentMat1).invert();
            parentMat0 = node.getWorldMatrix();
            invQuat1 = new Quaternion().copy(_localRotation1).invert();
        }
        newNode.children = [];
        if (!getModelNodeDef(node.type).preventCreatingInstanceChild) {
            let prevChildInvQuat1: Quaternion | undefined = undefined;
            for (let child of node.children) {
                const newChild = makeNewNode(child, parentMat0, parentMat1, invParentMat1, prevChildInvQuat1);
                prevChildInvQuat1 = newChild.invQuat1;
                newNode.children.push(newChild.creationInfo);
            }
        }
        newNode.expanded = node.expanded;
        newNode.selected = false;
        return {creationInfo: newNode, invQuat1};
    }

    const create = makeNewNode(node, baseMat, baseMat, invBaseMat).creationInfo;
    create.parentId = node.parent?.id;
    create.selected = true;
    ctx.model.selected = [];
    ctx.history.createNode(create);
}
