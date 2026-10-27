// Reuse the existing buttons and handlers; the compact menu invokes the same
// checked navigation, rather than creating a second routing implementation.
export function compactHeaderNavigation(dialog,selector){
 const nav=dialog.querySelector(selector),header=dialog.querySelector('header');if(!nav||!header)return;
 const buttons=[...nav.querySelectorAll('button')];if(buttons.length<2){nav.hidden=true;return;}
 header.classList.add('has-compact-nav');nav.classList.add('compact-header-nav');const close=header.querySelector(':scope > button');header.insertBefore(nav,close);
 const select=document.createElement('select');select.className='compact-header-menu';select.setAttribute('aria-label',nav.getAttribute('aria-label')??'切换功能');
 buttons.forEach((button,i)=>{const option=document.createElement('option');option.value=String(i);const label=button.cloneNode(true);label.querySelectorAll('[aria-hidden="true"]').forEach(el=>el.remove());option.textContent=label.textContent.trim();option.selected=button.getAttribute('aria-pressed')==='true'||button.getAttribute('aria-current')==='page'||button.classList.contains('active');option.disabled=button.disabled;select.append(option);});
 select.onchange=()=>buttons[Number(select.value)]?.click();header.insertBefore(select,close);
}
