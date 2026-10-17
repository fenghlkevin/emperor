import {portraitAsset} from './envoy-portraits.mjs';
export function envoyPortraitMarkup(a){return `<div class="envoy-fixed-scene" data-country="${a.countryId}" data-portrait="${a.variant}"><img class="envoy-fixed-portrait" data-fixed-envoy src="${portraitAsset(a)}" alt="外国使臣完整会面场景" draggable="false"></div>`;}
