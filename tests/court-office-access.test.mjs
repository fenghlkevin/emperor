import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {CENTRAL_OFFICES} from '../src/personnel.mjs';
import {canOfficeNavigate,assertOfficeNavigation,officeReportMarkup} from '../src/court-office-access.mjs';
import {officeTasks} from '../src/court-play-ui.mjs';
test('all deputies only expose read-only department report; writable routes reject',()=>{
 for(const office of CENTRAL_OFFICES.filter(o=>o.id.endsWith('-deputy'))){assert.deepEqual(officeTasks(office.id).map(t=>t.action),office.id==='war-deputy'?['register','office-report']:office.id==='personnel-deputy'?['personnel-profiles','office-report']:office.id==='justice-deputy'?['justice-prison','office-report']:['office-report']);assert.equal(canOfficeNavigate(office.id,'office-report'),true);
 for(const action of ['register','atlas-grain','personnel','industry','campaign','tax'])if(office.id==='war-deputy'&&action==='register')assert.doesNotThrow(()=>assertOfficeNavigation(office.id,action));else assert.throws(()=>assertOfficeNavigation(office.id,action),/此职/);}
});
test('ministers operate own department and prime minister only coordinates summary and petitions',()=>{
 assert.equal(canOfficeNavigate('works-minister','industry'),true);assert.equal(canOfficeNavigate('works-minister','tax'),false);assert.equal(canOfficeNavigate('revenue-minister','tax'),true);assert.equal(canOfficeNavigate('personnel-minister','personnel'),true);
 assert.deepEqual(officeTasks('prime-minister').map(t=>t.action),['office-report','domestic-register','petition']);assert.equal(canOfficeNavigate('prime-minister','special'),false);assert.equal(canOfficeNavigate('unknown','office-report'),false);
});
test('department reports are read-only and escape stored text; no operational controls',()=>{
 const s=newGame('职掌'),before=JSON.stringify(s);for(const o of CENTRAL_OFFICES){const html=officeReportMarkup(s,o.id);assert.doesNotMatch(html,/<form|<button|<input|data-court-action/);}
 assert.equal(JSON.stringify(s),before);s.domestic.provinces[0].name='<script>x</script>';assert.match(officeReportMarkup(s,'revenue-deputy'),/&lt;script&gt;/);
 assert.doesNotMatch(officeReportMarkup(s,'prime-minister'),/寺庙|任命|征兵/);
});
test('deep atlas and national views preserve department scope and reject cross-department commands',async()=>{
 const {officeSurfaceViews,assertOfficeSurface,assertNationalOfficeCommand}=await import('../src/court-office-access.mjs');
 assert.deepEqual(officeSurfaceViews('works-minister','atlas',['grain','finance','army','build']),['build']);
 assert.deepEqual(officeSurfaceViews('revenue-minister','atlas',['grain','finance','army','build']),['grain','finance']);
 assert.deepEqual(officeSurfaceViews('works-minister','national',['overview','works','royal','people','aid','honors','officials']),['works']);
 for(const office of ['works-deputy','prime-minister'])assert.deepEqual(officeSurfaceViews(office,'atlas',['grain','finance','army','build']),[]);
 assert.throws(()=>assertOfficeSurface('works-minister','atlas','finance'),/超出/);assert.throws(()=>assertNationalOfficeCommand('works-minister','migration'),/不属/);
 assert.doesNotThrow(()=>assertNationalOfficeCommand('works-minister','special'));assert.doesNotThrow(()=>assertNationalOfficeCommand('works-minister','cancel-special'));
 assert.deepEqual(officeSurfaceViews(undefined,'atlas',['grain','build']),['grain','build']);
});
test('central general handles training and garrison organization, not military resource administration',()=>{assert.deepEqual(officeTasks('central-general').map(t=>t.action),['register','office-report']);for(const a of ['garrison-purchase','campaign','garrison'])assert.equal(canOfficeNavigate('central-general',a),false);assert.equal(canOfficeNavigate('central-general','register'),true);});
