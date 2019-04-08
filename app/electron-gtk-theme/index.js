import _getTheme from './gtk-theme';

export default async function loadTheme(config = {outputPath: __dirname}) {
    const result = await _getTheme(config);

    if (!document.getElementById("gtk-theme")) {
        const style = document.createElement('style');
        style.id = 'gtk-theme';
        document.getElementsByTagName('head')[0].appendChild(style);
    }
    const style = document.getElementById("gtk-theme");
    style.innerHTML = result.raw;
    return result;
}
