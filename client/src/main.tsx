import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
// Self-hosted fonts: Plus Jakarta Sans (English UI), Cairo (Arabic UI), Bangers/Comic Neue/Lalezar (comic guide)
import '@fontsource/plus-jakarta-sans/latin-500.css'; import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css'; import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/cairo/arabic-400.css'; import '@fontsource/cairo/arabic-600.css'; import '@fontsource/cairo/arabic-700.css'; import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/latin-400.css'; import '@fontsource/cairo/latin-600.css'; import '@fontsource/cairo/latin-700.css'; import '@fontsource/cairo/latin-800.css';
import '@fontsource/bangers/latin-400.css'; import '@fontsource/comic-neue/latin-700.css';
import '@fontsource/lalezar/arabic-400.css'; import '@fontsource/lalezar/latin-400.css';
import './styles.css';
import App from './App'; import { AuthProvider } from './auth';
import { LangProvider, applyDocLang, getInitialLang } from './i18n';
import { ThemeProvider, applyTheme, initialTheme } from './Theme';

// Bootstrap (left-to-right or right-to-left build) is loaded by applyDocLang; wait for it so the page never flashes unstyled.
applyTheme(initialTheme());
applyDocLang(getInitialLang()).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><BrowserRouter><ThemeProvider><LangProvider><AuthProvider><App /></AuthProvider></LangProvider></ThemeProvider></BrowserRouter></React.StrictMode>);
});
