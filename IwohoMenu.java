package dev.iwoho.gui;

import dev.iwoho.IwohoClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.screen.option.OptionsScreen;
import net.minecraft.client.gui.screen.multiplayer.MultiplayerScreen;
import net.minecraft.client.gui.screen.world.SelectWorldScreen;
import net.minecraft.text.Text;
import net.minecraft.util.Util;
import net.minecraft.util.math.MathHelper;

/** Главное меню iwoho client: карточка по центру + анимированные фоны */
public class IwohoMenu extends Screen {
    private static final String[] LABELS = {"Одиночная игра", "Сетевая игра", "Настройки", "Выход"};
    private static final int[] ICONS = {0xff3b4d, 0x6cff9a, 0xb06cff, 0xffb347, 0xffffff};
    private static final int CARD_W = 200, CARD_H = 184, BTN_H = 24;

    private static int mode = 0;          // выбранный фон запоминается между открытиями
    private int prev = 0;
    private long switchAt = -10000;
    private final long openedAt = Util.getMeasuringTimeMs();
    private long lastFrame = openedAt;
    private final float[] hover = new float[LABELS.length];

    public IwohoMenu() { super(Text.literal("iwoho client")); }

    @Override public boolean shouldCloseOnEsc() { return false; }

    // ───────── helpers ─────────
    private static int argb(int a, int rgb) { return (MathHelper.clamp(a, 0, 255) << 24) | (rgb & 0xFFFFFF); }
    private static float lerp(float a, float b, float t) { return a + (b - a) * Math.min(1f, t); }
    private static int mix(int c1, int c2, float t) {
        int r = (int) lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t);
        int g = (int) lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t);
        int b = (int) lerp(c1 & 255, c2 & 255, t);
        return (r << 16) | (g << 8) | b;
    }
    private static float rnd(int n) { // псевдослучайное 0..1
        n = (n << 13) ^ n;
        return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 2147483648f;
    }

    // ───────── render ─────────
    @Override
    public void render(DrawContext c, int mx, int my, float delta) {
        long now = Util.getMeasuringTimeMs();
        float dt = Math.min(0.1f, (now - lastFrame) / 1000f);
        lastFrame = now;
        float t = now / 1000f;

        float k = MathHelper.clamp((now - switchAt) / 600f, 0f, 1f);
        if (k < 1f) { bg(c, prev, t, 255); bg(c, mode, t, (int) (255 * k)); }
        else bg(c, mode, t, 255);

        float e = MathHelper.clamp((now - openedAt) / 450f, 0f, 1f);
        e = 1 - (1 - e) * (1 - e) * (1 - e);
        int a = (int) (255 * e);
        int accent = IwohoClient.accent();

        int x = (width - CARD_W) / 2;
        int y = (height - CARD_H) / 2 + (int) ((1 - e) * 14);

        // свечение вокруг карточки
        for (int i = 1; i <= 8; i++)
            c.fill(x - i, y - i, x + CARD_W + i, y + CARD_H + i, argb((int) (a * 0.045f), accent));
        c.fill(x, y, x + CARD_W, y + CARD_H, argb((int) (a * 0.86f), 0x121419));
        c.fillGradient(x, y, x + CARD_W, y + 2, argb(a, accent), argb(a / 3, accent));

        // шапка
        c.fillGradient(x + 12, y + 12, x + 40, y + 40, argb(a, accent), argb(a, mix(accent, 0x000000, 0.65f)));
        c.fill(x + 18, y + 18, x + 34, y + 34, argb(a, 0x121419));
        c.fill(x + 22, y + 22, x + 30, y + 30, argb(a, accent));
        text(c, "iwoho client", x + 48, y + 16, 0xFFFFFF, a);
        text(c, "visuals client 1.0.0", x + 48, y + 28, 0x7d838e, a);

        text(c, "PLAY", x + 14, y + 52, 0x6a707b, a);
        int by = y + 64;
        for (int i = 0; i < LABELS.length; i++) {
            if (i == 3) { text(c, "GAME", x + 14, by + 4, 0x6a707b, a); by += 14; }
            int bx1 = x + 10, bx2 = x + CARD_W - 10;
            boolean hov = mx >= bx1 && mx < bx2 && my >= by && my < by + BTN_H - 2;
            hover[i] = lerp(hover[i], hov ? 1 : 0, dt * 14);
            c.fill(bx1, by, bx2, by + BTN_H - 2, argb(a, mix(0x1c1f26, 0x2a2e38, hover[i])));
            int ha = (int) (a * hover[i] * 0.5f);
            c.fillGradient(bx1, by, bx2, by + BTN_H - 2, argb(ha, accent), argb(ha / 4, accent));
            c.fill(bx1 + 6, by + 8, bx1 + 12, by + 14, argb(a, accent));
            text(c, LABELS[i], bx1 + 20 + (int) (hover[i] * 3), by + 8, mix(0xb4bac4, 0xFFFFFF, hover[i]), a);
            by += BTN_H + 2;
        }

        // переключатель фонов справа сверху
        for (int i = 0; i < ICONS.length; i++) {
            int ix = width - (ICONS.length - i) * 18 - 4, iy = 6;
            boolean sel = i == mode;
            boolean hov = mx >= ix && mx < ix + 14 && my >= iy && my < iy + 14;
            c.fill(ix - 1, iy - 1, ix + 15, iy + 15, argb(sel ? 230 : (hov ? 160 : 90), sel ? 0xFFFFFF : 0x000000));
            c.fill(ix, iy, ix + 14, iy + 14, argb(a, mix(0x101216, ICONS[i], sel ? 0.9f : (hov ? 0.6f : 0.35f))));
        }

        text(c, "iwoho client 1.0.0", 4, height - 11, 0xb0b0b0, 255);
        String r = "Mojang AB. Распространение запрещено!";
        text(c, r, width - textRenderer.getWidth(r) - 4, height - 11, 0xb0b0b0, 255);
    }

    private void text(DrawContext c, String s, int x, int y, int rgb, int a) {
        if (a < 8) return;
        c.drawTextWithShadow(textRenderer, s, x, y, argb(a, rgb));
    }

    // ───────── фоны ─────────
    private void bg(DrawContext c, int m, float t, int a) {
        if (a <= 2) return;
        switch (m) {
            case 0 -> { // волны цвета темы
                int col = IwohoClient.accent();
                c.fillGradient(0, 0, width, height, argb(a, mix(col, 0, 0.88f)), argb(a, mix(col, 0, 0.96f)));
                waves(c, t, a, col, 3, 0.16f);
            }
            case 1 -> { // aurora
                c.fillGradient(0, 0, width, height, argb(a, 0x02060f), argb(a, 0x0b0618));
                stars(c, t, a, 120);
                for (int x = 0; x < width; x += 4) {
                    float wv = MathHelper.sin(x * 0.010f + t * 0.4f) + 0.6f * MathHelper.sin(x * 0.027f - t * 0.7f);
                    int top = (int) (height * 0.16f + wv * height * 0.06f);
                    int bot = (int) (height * 0.58f + MathHelper.sin(x * 0.013f + t * 0.3f) * height * 0.08f);
                    int mid = top + (int) ((bot - top) * 0.7f);
                    float mv = (MathHelper.sin(x * 0.004f + t * 0.2f) + 1) / 2;
                    int col = mix(0x2bff8a, 0xa04dff, mv);
                    c.fillGradient(x, top, x + 4, mid, argb(0, col), argb((int) (a * 0.40f), col));
                    c.fillGradient(x, mid, x + 4, bot, argb((int) (a * 0.40f), col), argb(0, col));
                }
            }
            case 2 -> { // nebula
                c.fillGradient(0, 0, width, height, argb(a, 0x090412), argb(a, 0x04020a));
                stars(c, t, a, 80);
                for (int i = 0; i < 16; i++) {
                    int cx = (int) (width * (0.5f + 0.45f * MathHelper.sin(i * 1.7f + t * 0.07f * (1 + i % 3))));
                    int cy = (int) (height * (0.5f + 0.4f * MathHelper.cos(i * 2.3f + t * 0.05f)));
                    int col = mix(0x7a3cff, 0xff4fd8, (i % 4) / 3f);
                    int base = 70 + (i % 5) * 22;
                    for (float f : new float[]{1f, 0.7f, 0.4f}) {
                        int rr = (int) (base * f);
                        for (int dy = -rr; dy <= rr; dy += 3) {
                            int hw = (int) Math.sqrt(Math.max(0, rr * rr - dy * dy));
                            c.fill(cx - hw, cy + dy, cx + hw, cy + dy + 3, argb(a / 14, col));
                        }
                    }
                }
            }
            case 3 -> { // золотой поток
                c.fillGradient(0, 0, width, height, argb(a, 0x0d0703), argb(a, 0x050302));
                waves(c, t, a, 0xffa43a, 5, 0.06f);
            }
            default -> { // звёздное поле
                c.fillGradient(0, 0, width, height, argb(a, 0x02020a), argb(a, 0x06041a));
                stars(c, t, a, 220);
            }
        }
    }

    private void waves(DrawContext c, float t, int a, int color, int layers, float thick) {
        for (int L = 0; L < layers; L++) {
            for (int x = 0; x < width; x += 6) {
                float yc = height * (0.28f + 0.14f * L)
                        + MathHelper.sin(x * 0.007f + t * 0.55f + L * 1.9f) * height * 0.13f
                        + MathHelper.sin(x * 0.019f - t * 0.8f + L) * height * 0.025f;
                int bw = (int) (height * thick * (0.7f + 0.3f * MathHelper.sin(x * 0.011f + t + L)));
                int al = (int) (a * 0.30f);
                c.fillGradient(x, (int) yc - bw, x + 6, (int) yc, argb(0, color), argb(al, color));
                c.fillGradient(x, (int) yc, x + 6, (int) yc + bw, argb(al, color), argb(0, color));
            }
        }
    }

    private void stars(DrawContext c, float t, int a, int count) {
        for (int i = 0; i < count; i++) {
            float sp = 2 + rnd(i * 7 + 3) * 6;
            int x = (int) (((rnd(i * 13 + 1) * width) + t * sp) % width);
            int y = (int) (rnd(i * 29 + 5) * height);
            float tw = 0.5f + 0.5f * MathHelper.sin(t * (1 + rnd(i) * 2) + i);
            int s = rnd(i * 3 + 9) > 0.85f ? 2 : 1;
            c.fill(x, y, x + s, y + s, argb((int) (a * (0.35f + 0.65f * tw)), 0xFFFFFF));
        }
    }

    // ───────── клики ─────────
    @Override
    public boolean mouseClicked(double mx, double my, int btn) {
        if (btn != 0) return super.mouseClicked(mx, my, btn);

        for (int i = 0; i < ICONS.length; i++) {
            int ix = width - (ICONS.length - i) * 18 - 4, iy = 6;
            if (mx >= ix && mx < ix + 14 && my >= iy && my < iy + 14) {
                if (i != mode) { prev = mode; mode = i; switchAt = Util.getMeasuringTimeMs(); }
                return true;
            }
        }

        int x = (width - CARD_W) / 2;
        int y = (height - CARD_H) / 2;
        int by = y + 64;
        for (int i = 0; i < LABELS.length; i++) {
            if (i == 3) by += 14;
            if (mx >= x + 10 && mx < x + CARD_W - 10 && my >= by && my < by + BTN_H - 2) {
                switch (i) {
                    case 0 -> client.setScreen(new SelectWorldScreen(this));
                    case 1 -> client.setScreen(new MultiplayerScreen(this));
                    case 2 -> client.setScreen(new OptionsScreen(this, client.options));
                    case 3 -> client.scheduleStop();
                }
                return true;
            }
            by += BTN_H + 2;
        }
        return super.mouseClicked(mx, my, btn);
    }
}
