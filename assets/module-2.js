
/* Static/file edition. No automatic cross-device synchronisation. */
(function(){
 let attached=false;
 function setup(){const tg=window.Telegram?.WebApp;if(!tg||attached)return;attached=true;tg.ready();tg.expand();
 function insets(){const s=tg.contentSafeAreaInset||{};for(const side of ['top','bottom','left','right'])document.documentElement.style.setProperty('--tg-content-safe-area-inset-'+side,(s[side]||0)+'px');}
 insets();tg.onEvent('contentSafeAreaChanged',insets);tg.onEvent('backButtonClicked',()=>window.WordlyBridge?.back());tg.onEvent('themeChanged',()=>window.__app?.applyTheme());window.__app?.applyTheme();window.WordlyBridge?.updateBack();}
 window.WordlyTelegramSetup=setup;setup();
 if(window.visualViewport)visualViewport.addEventListener('resize',()=>document.documentElement.style.setProperty('--visual-height',visualViewport.height+'px'));
 window.WordlySync={enabled:false,status:'Локальное сохранение на этом устройстве · перенос через экспорт / импорт'};
})();

