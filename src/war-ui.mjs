import {openKitOffice} from './kit-office-ui.mjs';
export function openWar(initial,root,onCommit,onClose,options={}){return openKitOffice(initial,root,onCommit,onClose,{...options,tab:'war'});}
