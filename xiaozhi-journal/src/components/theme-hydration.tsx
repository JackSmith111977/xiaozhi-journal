/**
 * Client-side hydration corrector.
 * Uses an inline <script> to apply the theme class before first paint,
 * eliminating FOUC. Falls back to SSR-injected class if localStorage
 * is unavailable.
 */
export function ThemeHydration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var m=localStorage.getItem('xiaozhi:themeMode');
if(!m||m==='auto'){var h=new Date().getHours();if(h>=6&&h<18)return}else{
var d=false;if(m==='starry-night')d=true;else if(m==='system'){d=window.matchMedia('(prefers-color-scheme: dark)').matches}}
if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark')}catch(e){}})()`,
      }}
    />
  );
}
