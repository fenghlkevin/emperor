// Foreign-only campaigns do not reserve the player's troops or block domestic procurement.
export function playerMilitaryCrisis(d){
 const c=d.strategy?.pending;
 return Boolean(d.war?.battle||d.collapse?.pending||d.collapse?.ended||c&&(c.defender===d.playerCountryId||c.attacker===d.playerCountryId||c.playerAid));
}
