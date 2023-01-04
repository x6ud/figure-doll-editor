/**
 * Allow mouse dragging outside the dragged element.
 * @param immediatelyTriggerEvent If not null, immediately trigger drag move event when called
 * @param onDragMove
 * @param onDragEnd
 */
export function addGlobalDragListener(
    immediatelyTriggerEvent: PointerEvent | null,
    onDragMove: (e: PointerEvent) => void,
    onDragEnd?: (e: PointerEvent) => void
) {
    let onPointerUp: (e: PointerEvent) => void;
    let onPointerOut: (e: PointerEvent) => void;
    let _onDragMove = (e: PointerEvent) => {
        return onDragMove(e);
    };
    let _onDragEnd = (e: PointerEvent) => {
        document.removeEventListener('pointermove', _onDragMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointerout', onPointerOut);
        return onDragEnd && onDragEnd(e);
    };
    onPointerUp = _onDragEnd;
    onPointerOut = (e: PointerEvent) => {
        if (!e.relatedTarget || ((e.relatedTarget as HTMLElement).nodeName === 'HTML')) {
            _onDragEnd(e);
        }
    };

    document.addEventListener('pointermove', _onDragMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointerout', onPointerOut);

    if (immediatelyTriggerEvent) {
        _onDragMove(immediatelyTriggerEvent);
    }
}
