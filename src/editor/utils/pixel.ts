export function pixelLine(
    x0: number, y0: number,
    x1: number, y1: number,
    draw: (x: number, y: number) => void
) {
    let x, y, xe, ye;
    let dx = x1 - x0;
    let dy = y1 - y0;
    let dx1 = Math.abs(dx);
    let dy1 = Math.abs(dy);
    let px = 2 * dy1 - dx1;
    let py = 2 * dx1 - dy1;
    if (dy1 <= dx1) {
        if (dx >= 0) {
            x = x0;
            y = y0;
            xe = x1;
        } else {
            x = x1;
            y = y1;
            xe = x0;
        }
        draw(x, y);
        for (let i = 0; x < xe; i++) {
            x = x + 1;
            if (px < 0) {
                px = px + 2 * dy1;
            } else {
                if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                    y = y + 1;
                } else {
                    y = y - 1;
                }
                px = px + 2 * (dy1 - dx1);
            }
            draw(x, y);
        }
    } else {
        if (dy >= 0) {
            x = x0;
            y = y0;
            ye = y1;
        } else {
            x = x1;
            y = y1;
            ye = y0;
        }
        draw(x, y);
        for (let i = 0; y < ye; i++) {
            y = y + 1;
            if (py <= 0) {
                py = py + 2 * dx1;
            } else {
                if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
                    x = x + 1;
                } else {
                    x = x - 1;
                }
                py = py + 2 * (dx1 - dy1);
            }
            draw(x, y);
        }
    }
}
