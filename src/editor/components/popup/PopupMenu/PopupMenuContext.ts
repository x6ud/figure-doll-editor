import PopupMenuItemContext from './PopupMenuItemContext';

export default class PopupMenuContext {

    root?: PopupMenuContext;
    zIndex: number = 1000;
    show: (trigger: HTMLElement, position: string) => void;
    hide: () => void;
    currentVisibleSubMenu?: PopupMenuItemContext;

    constructor(show: (trigger: HTMLElement, position: string) => void, hide: () => void) {
        this.show = show;
        this.hide = hide;
    }

    handleMenuItemMouseOver(menuItem: PopupMenuItemContext, trigger: HTMLElement) {
        this.currentVisibleSubMenu?.subMenu?.hide();
        this.currentVisibleSubMenu = menuItem;
        menuItem.subMenu?.show(trigger, 'right');
    }

    hideAll() {
        if (this.root) {
            this.root.hide();
        } else {
            this.hide();
        }
    }

}