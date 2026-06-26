#!/usr/bin/env bun
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { stickers } from './schema'
import { config } from '../config'

interface StickerDef {
  name: string
  category: string
  size: number
  svgContent: string
}

const STICKERS: StickerDef[] = [
  // ── recommend ──
  { name: '爱心', category: 'recommend', size: 200, svgContent: '<path d="M50 85 C20 60 5 45 5 28 C5 15 15 5 28 5 C38 5 46 12 50 20 C54 12 62 5 72 5 C85 5 95 15 95 28 C95 45 80 60 50 85 Z" fill="#c2652a"/>' },
  { name: '星星', category: 'recommend', size: 200, svgContent: '<polygon points="50 5 61 35 95 35 68 55 79 85 50 65 21 85 32 55 5 35 39 35" fill="#c2652a"/>' },
  { name: '笑脸', category: 'recommend', size: 200, svgContent: '<circle cx="50" cy="50" r="45" fill="none" stroke="#c2652a" stroke-width="6"/><circle cx="34" cy="40" r="5" fill="#c2652a"/><circle cx="66" cy="40" r="5" fill="#c2652a"/><path d="M30 60 Q50 78 70 60" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '闪电', category: 'recommend', size: 200, svgContent: '<polygon points="55 5 25 50 45 50 35 95 75 45 55 45" fill="#c2652a"/>' },
  // ── geometric ──
  { name: '圆形', category: 'geometric', size: 200, svgContent: '<circle cx="50" cy="50" r="40" fill="none" stroke="#3a302a" stroke-width="6"/>' },
  { name: '方形', category: 'geometric', size: 200, svgContent: '<rect x="15" y="15" width="70" height="70" rx="6" fill="none" stroke="#3a302a" stroke-width="6"/>' },
  { name: '三角', category: 'geometric', size: 200, svgContent: '<polygon points="50 15 85 80 15 80" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>' },
  { name: '六边', category: 'geometric', size: 200, svgContent: '<polygon points="50 10 85 30 85 70 50 90 15 70 15 30" fill="none" stroke="#3a302a" stroke-width="6" stroke-linejoin="round"/>' },
  // ── nature ──
  { name: '叶子', category: 'nature', size: 200, svgContent: '<path d="M50 90 Q50 55 20 35 Q50 40 80 35 Q50 55 50 90 Z" fill="#2d4a3e"/><path d="M50 55 L50 80" stroke="#faf5ee" stroke-width="3" stroke-linecap="round"/>' },
  { name: '花朵', category: 'nature', size: 200, svgContent: '<circle cx="50" cy="50" r="10" fill="#c2652a"/><circle cx="50" cy="25" r="12" fill="#e08850"/><circle cx="75" cy="50" r="12" fill="#e08850"/><circle cx="50" cy="75" r="12" fill="#e08850"/><circle cx="25" cy="50" r="12" fill="#e08850"/>' },
  { name: '太阳', category: 'nature', size: 200, svgContent: '<circle cx="50" cy="50" r="18" fill="#c2652a"/><g stroke="#c2652a" stroke-width="5" stroke-linecap="round"><line x1="50" y1="12" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="88"/><line x1="12" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="88" y2="50"/><line x1="23" y1="23" x2="30" y2="30"/><line x1="77" y1="77" x2="70" y2="70"/><line x1="77" y1="23" x2="70" y2="30"/><line x1="23" y1="77" x2="30" y2="70"/></g>' },
  { name: '月亮', category: 'nature', size: 200, svgContent: '<path d="M55 10 A35 35 0 1 1 55 80 A25 25 0 1 0 55 10 Z" fill="#3a302a"/>' },
  // ── abstract ──
  { name: '波浪', category: 'abstract', size: 200, svgContent: '<path d="M10 55 Q25 35 40 55 T70 55 T100 55" fill="none" stroke="#3a302a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '螺旋', category: 'abstract', size: 200, svgContent: '<path d="M55 50 C55 47 47 47 47 55 C47 65 65 65 65 50 C65 35 35 35 35 55 C35 75 75 75 75 50" fill="none" stroke="#c2652a" stroke-width="6" stroke-linecap="round"/>' },
  { name: '墨点', category: 'abstract', size: 200, svgContent: '<path d="M50 15 C75 15 90 35 85 55 C80 75 60 90 45 85 C25 80 10 60 15 40 C20 20 35 15 50 15 Z" fill="#3a302a"/>' },
  // ── emoji ──
  {
    name: '开心', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><circle cx="34" cy="40" r="4.5" fill="#3D2B1F"/><circle cx="66" cy="40" r="4.5" fill="#3D2B1F"/><path d="M28 58 Q50 78 72 58" fill="none" stroke="#3D2B1F" stroke-width="4.5" stroke-linecap="round"/><circle cx="24" cy="52" r="6" fill="#FFB8B8" opacity="0.6"/><circle cx="76" cy="52" r="6" fill="#FFB8B8" opacity="0.6"/>`
  },
  {
    name: '大笑', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><path d="M28 36 Q34 28 40 36" fill="none" stroke="#3D2B1F" stroke-width="4" stroke-linecap="round"/><path d="M60 36 Q66 28 72 36" fill="none" stroke="#3D2B1F" stroke-width="4" stroke-linecap="round"/><ellipse cx="50" cy="62" rx="18" ry="16" fill="#3D2B1F"/><ellipse cx="50" cy="68" rx="10" ry="7" fill="#FF8A8A"/><path d="M24 42 Q22 50 24 54" fill="none" stroke="#54A0FF" stroke-width="3" stroke-linecap="round"/><path d="M76 42 Q78 50 76 54" fill="none" stroke="#54A0FF" stroke-width="3" stroke-linecap="round"/>`
  },
  {
    name: '爱心眼', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><path d="M32 42 Q28 34 36 36 Q40 34 42 38 Q48 32 48 40 L36 52 Z" fill="#FF4757"/><path d="M52 42 Q48 34 56 36 Q60 34 62 38 Q68 32 68 40 L56 52 Z" fill="#FF4757"/><path d="M34 60 Q50 76 66 60" fill="none" stroke="#3D2B1F" stroke-width="4" stroke-linecap="round"/><circle cx="26" cy="56" r="7" fill="#FFB8B8" opacity="0.5"/><circle cx="74" cy="56" r="7" fill="#FFB8B8" opacity="0.5"/>`
  },
  {
    name: '酷', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><rect x="22" y="34" width="56" height="22" rx="8" fill="#2D3436"/><line x1="50" y1="40" x2="50" y2="50" stroke="#2D3436" stroke-width="3"/><path d="M36 66 Q50 72 62 66" fill="none" stroke="#3D2B1F" stroke-width="4" stroke-linecap="round"/><path d="M14 34 Q20 20 38 24 Q50 18 62 24 Q80 20 86 34" fill="none" stroke="#3D2B1F" stroke-width="5" stroke-linecap="round"/>`
  },
  {
    name: '飞吻', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><circle cx="34" cy="40" r="4.5" fill="#3D2B1F"/><path d="M58 40 Q66 36 72 40" fill="none" stroke="#3D2B1F" stroke-width="4" stroke-linecap="round"/><path d="M42 62 Q38 56 44 58 Q48 56 48 62 L44 68 Z" fill="#FF4757"/><path d="M50 62 Q46 56 52 58 Q56 56 56 62 L52 68 Z" fill="#FF4757"/><path d="M72 30 Q68 24 76 28 Q80 26 78 30 Z" fill="#FF4757" opacity="0.7"/><path d="M80 20 Q78 16 84 18 Q86 16 84 20 Z" fill="#FF4757" opacity="0.5"/>`
  },
  {
    name: '泪崩', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFD93D"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8C43A" stroke-width="2"/><circle cx="32" cy="40" r="5" fill="#3D2B1F"/><circle cx="68" cy="40" r="5" fill="#3D2B1F"/><circle cx="31" cy="39" r="2" fill="white" opacity="0.7"/><circle cx="67" cy="39" r="2" fill="white" opacity="0.7"/><path d="M34 66 Q50 54 66 66" fill="none" stroke="#3D2B1F" stroke-width="4.5" stroke-linecap="round"/><path d="M26 46 Q22 56 24 60" fill="none" stroke="#54A0FF" stroke-width="4" stroke-linecap="round"/><path d="M22 52 Q18 62 20 66" fill="none" stroke="#54A0FF" stroke-width="3" stroke-linecap="round"/><path d="M74 46 Q78 56 76 60" fill="none" stroke="#54A0FF" stroke-width="4" stroke-linecap="round"/><path d="M78 52 Q82 62 80 66" fill="none" stroke="#54A0FF" stroke-width="3" stroke-linecap="round"/>`
  },
  {
    name: '点赞', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#4A90D9"/><circle cx="50" cy="50" r="48" fill="none" stroke="#3A7BC8" stroke-width="2"/><g fill="white"><rect x="38" y="42" width="24" height="28" rx="8"/><rect x="56" y="20" width="16" height="32" rx="8"/><circle cx="64" cy="22" r="9"/></g>`
  },
  {
    name: '爱心', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FF4757"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E03E4E" stroke-width="2"/><path d="M50 78 C22 56 8 40 8 28 C8 16 18 8 30 8 C40 8 48 16 50 24 C52 16 60 8 70 8 C82 8 92 16 92 28 C92 40 78 56 50 78 Z" fill="white"/>`
  },
  {
    name: '火焰', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FF6B35"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E55A28" stroke-width="2"/><g fill="white"><path d="M50 82 C60 70 68 58 66 48 C64 38 58 30 56 22 C54 30 54 38 50 44 C48 38 48 28 44 20 C42 28 38 38 36 46 C32 56 40 70 50 82 Z"/><path d="M44 72 C50 66 54 58 52 52 C50 48 46 44 44 42 C42 48 40 52 40 56 C38 62 40 68 44 72 Z" fill="#FF6B35"/></g>`
  },
  {
    name: '星星', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFC048"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8A838" stroke-width="2"/><polygon points="50 8 60 35 90 35 66 56 76 88 50 68 24 88 34 56 10 35 40 35" fill="white"/>`
  },
  {
    name: '力量', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#A55EEA"/><circle cx="50" cy="50" r="48" fill="none" stroke="#8E4ED6" stroke-width="2"/><g fill="white"><ellipse cx="68" cy="46" rx="14" ry="26" transform="rotate(25, 68, 46)"/><circle cx="52" cy="86" r="10"/><ellipse cx="50" cy="76" rx="10" ry="14"/></g>`
  },
  {
    name: '胜利', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#2ED573"/><circle cx="50" cy="50" r="48" fill="none" stroke="#26B862" stroke-width="2"/><g fill="white"><rect x="42" y="44" width="16" height="30" rx="8"/><rect x="38" y="24" width="14" height="26" rx="7" transform="rotate(-15, 45, 37)"/><rect x="52" y="24" width="14" height="26" rx="7" transform="rotate(15, 59, 37)"/></g>`
  },
  {
    name: '披萨', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><path d="M50 82 L20 28 L80 28 Z" fill="#F4A460"/><path d="M50 82 L20 28 L80 28 Z" fill="none" stroke="#D4893E" stroke-width="2"/><circle cx="38" cy="50" r="6" fill="#FF4757"/><circle cx="62" cy="50" r="6" fill="#FF4757"/><circle cx="50" cy="40" r="5" fill="#FF6B35"/><circle cx="35" cy="38" r="4" fill="#2ED573"/><circle cx="65" cy="38" r="4" fill="#2ED573"/>`
  },
  {
    name: '汉堡', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><g><path d="M18 38 Q18 18 50 18 Q82 18 82 38 Z" fill="#F4A460"/><path d="M20 42 Q30 36 40 42 Q50 36 60 42 Q70 36 80 42 Q70 48 60 42 Q50 48 40 42 Q30 48 20 42 Z" fill="#2ED573"/><rect x="22" y="46" width="56" height="6" rx="2" fill="#FFC048"/><rect x="20" y="52" width="60" height="10" rx="4" fill="#8B4513"/><path d="M18 64 L18 70 Q18 80 50 80 Q82 80 82 70 L82 64 Z" fill="#F4A460"/><ellipse cx="40" cy="26" rx="3" ry="2" fill="#FFD5B0"/><ellipse cx="55" cy="24" rx="3" ry="2" fill="#FFD5B0"/><ellipse cx="48" cy="30" rx="3" ry="2" fill="#FFD5B0"/></g>`
  },
  {
    name: '甜甜圈', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><circle cx="50" cy="60" r="30" fill="#D4A574"/><circle cx="50" cy="60" r="12" fill="#FFF0E0"/><path d="M22 52 Q30 38 50 40 Q70 38 78 52 Q70 56 50 54 Q30 56 22 52 Z" fill="#FF9FF3"/><path d="M24 52 Q30 48 40 50 Q50 48 60 50 Q70 48 76 52" fill="none" stroke="#FF6B9D" stroke-width="2"/><rect x="30" y="44" width="6" height="2" rx="1" fill="#FFC048" transform="rotate(-30, 33, 45)"/><rect x="45" y="42" width="6" height="2" rx="1" fill="#54A0FF" transform="rotate(20, 48, 43)"/><rect x="60" y="44" width="6" height="2" rx="1" fill="#2ED573" transform="rotate(-10, 63, 45)"/><rect x="52" y="48" width="6" height="2" rx="1" fill="#FF4757" transform="rotate(45, 55, 49)"/>`
  },
  {
    name: '冰淇淋', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><path d="M38 82 L50 56 L62 82 Z" fill="#D4A574"/><path d="M38 82 L50 56 L62 82 Z" fill="none" stroke="#B8895E" stroke-width="2"/><line x1="42" y1="74" x2="58" y2="74" stroke="#B8895E" stroke-width="1.5"/><line x1="44" y1="68" x2="56" y2="68" stroke="#B8895E" stroke-width="1.5"/><line x1="46" y1="62" x2="54" y2="62" stroke="#B8895E" stroke-width="1.5"/><circle cx="50" cy="40" r="22" fill="#FF9FF3"/><circle cx="38" cy="32" r="14" fill="#FFB8D9"/><circle cx="50" cy="18" r="7" fill="#FF4757"/><path d="M50 12 Q52 4 58 6" fill="none" stroke="#2ED573" stroke-width="2.5" stroke-linecap="round"/>`
  },
  {
    name: '蛋糕', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><rect x="18" y="40" width="64" height="44" rx="6" fill="#FFD93D"/><rect x="18" y="52" width="64" height="10" fill="#FF9FF3"/><path d="M18 40 Q24 32 34 40 Q40 34 50 40 Q56 34 64 40 Q72 32 82 40 Z" fill="#FF9FF3"/><rect x="47" y="14" width="6" height="26" rx="3" fill="#54A0FF"/><path d="M50 10 Q54 4 50 2 Q46 4 50 10 Z" fill="#FFC048"/><path d="M50 10 Q52 6 50 4 Q48 6 50 10 Z" fill="#FF6B35"/><circle cx="28" cy="64" r="3" fill="#FF4757"/><circle cx="42" cy="64" r="3" fill="#2ED573"/><circle cx="58" cy="64" r="3" fill="#FF4757"/><circle cx="72" cy="64" r="3" fill="#2ED573"/>`
  },
  {
    name: '咖啡', category: 'emoji', size: 400,
    svgContent: `<rect x="2" y="2" width="96" height="96" rx="20" fill="#FFF0E0"/><rect x="2" y="2" width="96" height="96" rx="20" fill="none" stroke="#FFD5B0" stroke-width="2"/><rect x="22" y="30" width="44" height="46" rx="8" fill="white"/><rect x="22" y="30" width="44" height="46" rx="8" fill="none" stroke="#D4A574" stroke-width="3"/><rect x="26" y="34" width="36" height="16" rx="4" fill="#6B3A2A"/><path d="M66 40 Q82 40 82 52 Q82 64 66 64" fill="none" stroke="#D4A574" stroke-width="3"/><path d="M32 28 Q34 20 32 14" fill="none" stroke="#D4A574" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/><path d="M46 26 Q48 18 46 12" fill="none" stroke="#D4A574" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/><path d="M58 28 Q60 20 58 14" fill="none" stroke="#D4A574" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>`
  },
  {
    name: '猫猫', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FF9FF3"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E88AD4" stroke-width="2"/><g fill="white"><polygon points="24 34 28 10 38 30"/><polygon points="76 34 72 10 62 30"/></g><circle cx="50" cy="52" r="26" fill="white"/><ellipse cx="38" cy="48" rx="6" ry="8" fill="#2D3436"/><ellipse cx="62" cy="48" rx="6" ry="8" fill="#2D3436"/><circle cx="36" cy="46" r="2.5" fill="white"/><circle cx="60" cy="46" r="2.5" fill="white"/><path d="M48 56 L50 59 L52 56 Z" fill="#FF9FF3"/><path d="M44 62 Q50 66 56 62" fill="none" stroke="#2D3436" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="54" x2="34" y2="56" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/><line x1="16" y1="62" x2="34" y2="60" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/><line x1="84" y1="54" x2="66" y2="56" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/><line x1="84" y1="62" x2="66" y2="60" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/><circle cx="30" cy="60" r="5" fill="#FFB8D9" opacity="0.5"/><circle cx="70" cy="60" r="5" fill="#FFB8D9" opacity="0.5"/>`
  },
  {
    name: '狗狗', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#54A0FF"/><circle cx="50" cy="50" r="48" fill="none" stroke="#4488E0" stroke-width="2"/><ellipse cx="24" cy="30" rx="14" ry="22" fill="#4488E0" transform="rotate(15, 24, 30)"/><ellipse cx="76" cy="30" rx="14" ry="22" fill="#4488E0" transform="rotate(-15, 76, 30)"/><circle cx="50" cy="52" r="26" fill="white"/><circle cx="38" cy="48" r="6" fill="#2D3436"/><circle cx="62" cy="48" r="6" fill="#2D3436"/><circle cx="36" cy="46" r="2.5" fill="white"/><circle cx="60" cy="46" r="2.5" fill="white"/><ellipse cx="50" cy="58" rx="6" ry="4" fill="#2D3436"/><ellipse cx="50" cy="66" rx="5" ry="7" fill="#FF8A8A"/><path d="M44 62 Q50 64 56 62" fill="none" stroke="#2D3436" stroke-width="1.5"/>`
  },
  {
    name: '兔兔', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FF9F43"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E08838" stroke-width="2"/><ellipse cx="36" cy="14" rx="8" ry="22" fill="white"/><ellipse cx="64" cy="14" rx="8" ry="22" fill="white"/><ellipse cx="36" cy="14" rx="5" ry="16" fill="#FFB8D9"/><ellipse cx="64" cy="14" rx="5" ry="16" fill="#FFB8D9"/><circle cx="50" cy="54" r="24" fill="white"/><circle cx="40" cy="50" r="5" fill="#2D3436"/><circle cx="60" cy="50" r="5" fill="#2D3436"/><circle cx="38" cy="48" r="2" fill="white"/><circle cx="58" cy="48" r="2" fill="white"/><circle cx="50" cy="58" r="3" fill="#FFB8D9"/><path d="M46 62 Q50 66 54 62" fill="none" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/><rect x="47" y="62" width="6" height="4" rx="1" fill="white" stroke="#2D3436" stroke-width="1"/><circle cx="30" cy="60" r="5" fill="#FFB8D9" opacity="0.4"/><circle cx="70" cy="60" r="5" fill="#FFB8D9" opacity="0.4"/>`
  },
  {
    name: '熊猫', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#2D3436"/><circle cx="50" cy="50" r="48" fill="none" stroke="#1A1E20" stroke-width="2"/><circle cx="22" cy="22" r="12" fill="#2D3436"/><circle cx="78" cy="22" r="12" fill="#2D3436"/><circle cx="50" cy="56" r="28" fill="white"/><ellipse cx="36" cy="48" rx="12" ry="10" fill="#2D3436" transform="rotate(-10, 36, 48)"/><ellipse cx="64" cy="48" rx="12" ry="10" fill="#2D3436" transform="rotate(10, 64, 48)"/><circle cx="36" cy="48" r="4" fill="white"/><circle cx="64" cy="48" r="4" fill="white"/><circle cx="34" cy="46" r="2" fill="#2D3436"/><circle cx="62" cy="46" r="2" fill="#2D3436"/><ellipse cx="50" cy="58" rx="5" ry="3" fill="#2D3436"/><path d="M46 62 Q50 66 54 62" fill="none" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/>`
  },
  {
    name: '熊熊', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#D4A574"/><circle cx="50" cy="50" r="48" fill="none" stroke="#B8895E" stroke-width="2"/><circle cx="24" cy="24" r="12" fill="#D4A574"/><circle cx="76" cy="24" r="12" fill="#D4A574"/><circle cx="24" cy="24" r="6" fill="#B8895E"/><circle cx="76" cy="24" r="6" fill="#B8895E"/><circle cx="50" cy="54" r="26" fill="#E8C4A0"/><circle cx="38" cy="48" r="5" fill="#2D3436"/><circle cx="62" cy="48" r="5" fill="#2D3436"/><circle cx="36" cy="46" r="2" fill="white"/><circle cx="60" cy="46" r="2" fill="white"/><ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#2D3436"/><path d="M45 62 Q50 66 55 62" fill="none" stroke="#2D3436" stroke-width="1.5" stroke-linecap="round"/>`
  },
  {
    name: '小鸡', category: 'emoji', size: 400,
    svgContent: `<circle cx="50" cy="50" r="48" fill="#FFEAA7"/><circle cx="50" cy="50" r="48" fill="none" stroke="#E8D490" stroke-width="2"/><circle cx="50" cy="56" r="26" fill="#FFD93D"/><circle cx="50" cy="42" r="20" fill="#FFD93D"/><circle cx="42" cy="38" r="4" fill="#2D3436"/><circle cx="58" cy="38" r="4" fill="#2D3436"/><circle cx="40" cy="36" r="1.5" fill="white"/><circle cx="56" cy="36" r="1.5" fill="white"/><polygon points="46 46 54 46 50 52" fill="#FF6B35"/><circle cx="34" cy="44" r="4" fill="#FFB8B8" opacity="0.5"/><circle cx="66" cy="44" r="4" fill="#FFB8B8" opacity="0.5"/><ellipse cx="30" cy="56" rx="8" ry="12" fill="#FFD93D" stroke="#E8C43A" stroke-width="2"/><ellipse cx="70" cy="56" rx="8" ry="12" fill="#FFD93D" stroke="#E8C43A" stroke-width="2"/><path d="M40 80 L36 88 L40 88 M40 86" fill="none" stroke="#FF6B35" stroke-width="3" stroke-linecap="round"/><path d="M60 80 L56 88 L60 88 M60 86" fill="none" stroke="#FF6B35" stroke-width="3" stroke-linecap="round"/>`
  },
]

async function main() {
  const sharp = (await import('sharp')).default
  const stickerDir = resolve(config.stickerDir)
  mkdirSync(stickerDir, { recursive: true })

  const sqlite = new Database(config.dbPath, { create: true })
  const db = drizzle(sqlite)

  const existing = sqlite.query('SELECT COUNT(*) as c FROM stickers WHERE user_id IS NULL').get()
  if (existing && (existing as any).c > 0) {
    console.log(`System stickers already seeded (${(existing as any).c} found). Skipping.`)
    process.exit(0)
  }

  console.log(`Seeding ${STICKERS.length} system stickers to ${stickerDir}...`)

  let count = 0
  for (const s of STICKERS) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">${s.svgContent}</svg>`
    const filename = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    const filepath = resolve(stickerDir, filename)

    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(s.size, s.size)
      .png()
      .toBuffer()

    writeFileSync(filepath, pngBuffer)

    await db.insert(stickers).values({
      name: s.name,
      category: s.category,
      imagePath: filename,
      width: s.size,
      height: s.size
    })

    count++
    console.log(`  [${count}/${STICKERS.length}] ${s.name} — ${s.category} (${s.size}x${s.size})`)
  }

  console.log(`\nDone! ${count} stickers seeded.`)
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
