export const RANDOM_BEAUTY_ART=[
  {
    "id": "zhongyuan",
    "name": "zhongyuan",
    "asset": "assets/beauties/random/zhongyuan-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/zhongyuan.png"
    ]
  },
  {
    "id": "hebei",
    "name": "hebei",
    "asset": "assets/beauties/random/hebei-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/hebei.png",
      "assets/beauties/random/hebei-clean-v1.png",
      "assets/beauties/random/hebei-redesign-v3.png"
    ]
  },
  {
    "id": "henan",
    "name": "henan",
    "asset": "assets/beauties/random/henan-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/henan.png"
    ]
  },
  {
    "id": "v1-sheng-00",
    "name": "v1-sheng-00",
    "asset": "assets/beauties/random/v1-sheng-00-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/v1-sheng-00.png"
    ]
  },
  {
    "id": "v1-sheng-02",
    "name": "v1-sheng-02",
    "asset": "assets/beauties/random/v1-sheng-02-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/v1-sheng-02.png"
    ]
  },
  {
    "id": "v1-sheng-03",
    "name": "v1-sheng-03",
    "asset": "assets/beauties/random/v1-sheng-03-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/v1-sheng-03.png"
    ]
  },
  {
    "id": "peony-red",
    "name": "红衣牡丹",
    "asset": "assets/beauties/random/peony-red-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/peony-red-v1.png"
    ]
  },
  {
    "id": "pine-silk",
    "name": "松下唐纱",
    "asset": "assets/beauties/random/pine-silk-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/pine-silk-v1.png"
    ]
  },
  {
    "id": "candle-curtain",
    "name": "秉烛卷帘",
    "asset": "assets/beauties/random/candle-curtain-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/candle-curtain-v1.png"
    ]
  },
  {
    "id": "lotus-picker",
    "name": "采莲",
    "asset": "assets/beauties/random/lotus-picker-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/lotus-picker-v1.png"
    ]
  },
  {
    "id": "railing-coral",
    "name": "斜肩倚栏",
    "asset": "assets/beauties/random/railing-coral-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/railing-coral-v1.png"
    ]
  },
  {
    "id": "spring-rider",
    "name": "春游骑装",
    "asset": "assets/beauties/random/spring-rider-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/spring-rider-v2.png"
    ]
  },
  {
    "id": "autumn-flute",
    "name": "秋风胡笳",
    "asset": "assets/beauties/random/autumn-flute-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/autumn-flute-v1.png",
      "assets/beauties/random/autumn-flute-clean-v1.png"
    ]
  },
  {
    "id": "red-twin-buns",
    "name": "红花双髻",
    "asset": "assets/beauties/random/red-twin-buns-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/red-twin-buns-v1.png",
      "assets/beauties/random/red-twin-buns-clean-v1.png"
    ]
  },
  {
    "id": "butterfly-sleeves",
    "name": "长袖舞蝶",
    "asset": "assets/beauties/random/butterfly-sleeves-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/butterfly-sleeves-v1.png",
      "assets/beauties/random/butterfly-sleeves-clean-v1.png"
    ]
  },
  {
    "id": "green-fan",
    "name": "罗衣绿扇",
    "asset": "assets/beauties/random/green-fan-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/green-fan-v1.png"
    ]
  },
  {
    "id": "blue-dancer",
    "name": "蓝裙起舞",
    "asset": "assets/beauties/random/blue-dancer-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/blue-dancer-v1.png",
      "assets/beauties/random/blue-dancer-clean-v1.png"
    ]
  },
  {
    "id": "moon-silk",
    "name": "秋清冷月",
    "asset": "assets/beauties/random/moon-silk-clean-v1.png",
    "legacyAssets": [
      "assets/beauties/random/moon-silk-v1.png"
    ]
  },
  {
    "id": "rabbit-play",
    "name": "薄衣戏兔",
    "asset": "assets/beauties/random/rabbit-play-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/rabbit-play-v1.png",
      "assets/beauties/random/rabbit-play-clean-v1.png"
    ]
  },
  {
    "id": "oasis-dance",
    "name": "异域舞女",
    "asset": "assets/beauties/random/oasis-dance-redesign-v2.png",
    "legacyAssets": [
      "assets/beauties/random/oasis-dance-v1.png",
      "assets/beauties/random/oasis-dance-clean-v1.png"
    ]
  }
];
export const RANDOM_PORTRAITS=RANDOM_BEAUTY_ART.map(p=>p.asset);
export function resolveRandomPortraitAsset(asset){return RANDOM_BEAUTY_ART.find(p=>p.asset===asset||p.legacyAssets.includes(asset))?.asset;}
