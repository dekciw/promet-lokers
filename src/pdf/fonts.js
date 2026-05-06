/**
 * Регистрация Roboto Cyrillic TTF из jsDelivr CDN.
 *
 * ВАЖНО:
 * - Файл импортируется как side-effect ОДИН раз из generateNZ.js.
 * - НЕ вызывать Font.register() внутри React-компонента — приведёт к
 *   многократной перерегистрации при ре-рендере.
 * - woff2 НЕ работает в react-pdf — используем TTF.
 * - SVG логотип НЕ работает в <Image> — используем PNG (см. NZDocument.jsx).
 *
 * URLs подтверждены HTTP 200 с CORS (jsDelivr fontsource Roboto cyrillic).
 */
import { Font } from '@react-pdf/renderer';

const CDN = 'https://cdn.jsdelivr.net/fontsource/fonts/roboto@latest';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: `${CDN}/cyrillic-400-normal.ttf`, fontWeight: 400 },
    { src: `${CDN}/cyrillic-500-normal.ttf`, fontWeight: 500 },
    { src: `${CDN}/cyrillic-700-normal.ttf`, fontWeight: 700 },
  ],
});
