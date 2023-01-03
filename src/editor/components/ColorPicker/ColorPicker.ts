import {Color} from 'three';
import {computed, defineComponent, PropType, reactive, ref, watch} from 'vue';
import {addGlobalDragListener} from '../../../common/utils/dom';

const boxLocalStorageKey = 'color-box';
const activeLocalStorageKey = 'color-box-active';

export default defineComponent({
    props: {
        value: {
            type: Array as PropType<number[]>,
            default: [1, 1, 1]
        }
    },
    emits: ['update:value'],
    setup(props, ctx) {
        const hueRing = ref<HTMLElement>();
        const svRect = ref<HTMLElement>();
        const RING_RADIUS = 160 / 2;
        const RING_SIZE = 13;
        const color = reactive(new Color());
        const hsl = reactive({h: 0, s: 0, l: 0});
        const h = ref(0);
        const s = ref(0);
        const v = ref(0);
        const activeBox = ref(0);
        const colorBox = reactive([
            0xffffff,
            0xffffff,
            0xffffff,
            0xffffff,
            0xffffff,
            0xffffff,
            0xffffff,
            0xffffff
        ]);
        try {
            const jsonStr = localStorage.getItem(boxLocalStorageKey);
            if (jsonStr) {
                const json = JSON.parse(jsonStr);
                for (let i = 0, len = colorBox.length; i < len; ++i) {
                    colorBox[i] = json[i];
                }
            }
            const jsonStr2 = localStorage.getItem(activeLocalStorageKey);
            if (jsonStr2) {
                activeBox.value = JSON.parse(jsonStr2);
            }
        } catch (e) {
            console.error(e);
        }
        watch(colorBox, function () {
            localStorage.setItem(boxLocalStorageKey, JSON.stringify(colorBox));
        }, {deep: true});
        watch(activeBox, function () {
            localStorage.setItem(activeLocalStorageKey, JSON.stringify(activeBox.value));
        });

        watch(() => props.value, function () {
            color.setRGB(props.value[0], props.value[1], props.value[2]);
            color.getHSL(hsl);
            let _h = hsl.h;
            let _s = hsl.s;
            let _l = hsl.l;
            let _v = _s * Math.min(_l, 1 - _l) + _l;
            _s = _v ? 2 - 2 * _l / _v : 0;
            if (_s || _v || (v.value && !_s && !_v)) {
                s.value = _s;
                v.value = _v;
            }
            if (_s) {
                h.value = _h;
            }
            colorBox[activeBox.value] = color.getHex();
        }, {immediate: true});

        const hex = computed(function () {
            return color.getHexString();
        });
        const colorBoxHex = computed(function () {
            return colorBox.map(val => new Color().setHex(val).getHexString());
        });
        const hueRingHandlerStyle = computed(function () {
            return {
                transform: `rotate(${Math.round(h.value * 360) - 60}deg)`,
                'transform-origin': `0 ${RING_RADIUS}px`
            };
        });
        const svRectStyle = computed(function () {
            const color = new Color().setHSL(h.value, 1, .5);
            return {
                'background-color': `#${color.getHexString()}`
            };
        });
        const svRectHandlerStyle = computed(function () {
            return {
                left: `${Math.round(100 * s.value)}%`,
                top: `${Math.round(100 * (1 - v.value))}%`,
            };
        });

        function onHueRingMouseDown(e: MouseEvent) {
            e.stopPropagation();
            const rect = hueRing.value!.getBoundingClientRect();
            const cx = RING_RADIUS;
            const cy = RING_RADIUS;
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const mr = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (!(mr >= RING_RADIUS - RING_SIZE && mr <= RING_RADIUS)) {
                return;
            }
            addGlobalDragListener(
                e,
                (e) => {
                    const x = e.clientX - rect.left - cx;
                    const y = e.clientY - rect.top - cy;
                    const angle = (Math.atan2(y, x) / Math.PI * 180 + 360 * 2 + 90 + 60) % 360;
                    const h_ = angle / 360;
                    const color = new Color().setHSL(h_, hsl.s, hsl.l);
                    ctx.emit('update:value', [color.r, color.g, color.b]);
                    h.value = h_;
                }
            );
        }

        function onSvRectMouseDown(e: MouseEvent) {
            e.stopPropagation();
            const rect = svRect.value!.getBoundingClientRect();
            addGlobalDragListener(
                e,
                (e) => {
                    let _s = Math.min(Math.max(e.clientX - rect.left, 0), rect.width) / rect.width;
                    let _v = 1 - Math.min(Math.max(e.clientY - rect.top, 0), rect.height) / rect.height;
                    s.value = _s;
                    v.value = _v;
                    let _l = _v - _v * _s / 2;
                    let _m = Math.min(_l, 1 - _l);
                    _s = _m ? (_v - _l) / _m : 0;
                    const color = new Color().setHSL(h.value, _s, _l);
                    ctx.emit('update:value', [color.r, color.g, color.b]);
                }
            );
        }

        function onTextInput(e: InputEvent) {
            const input = e.target as HTMLInputElement;
            const str = (input.value || '').trim();
            if (/^([a-fA-F0-9]{6})$/.test(str)) {
                const rgb = Number.parseInt(str.substring(0, 6), 16);
                const color = new Color().setHex(rgb);
                ctx.emit('update:value', [color.r, color.g, color.b]);
            }
        }

        function onBoxClick(i: number) {
            activeBox.value = i;
            const color = new Color().setHex(colorBox[i]);
            ctx.emit('update:value', [color.r, color.g, color.b]);
        }

        return {
            hueRing,
            svRect,
            activeBox,
            hex,
            colorBoxHex,
            hueRingHandlerStyle,
            svRectStyle,
            svRectHandlerStyle,
            onHueRingMouseDown,
            onSvRectMouseDown,
            onTextInput,
            onBoxClick,
        };
    }
});
