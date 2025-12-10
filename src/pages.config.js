import NikudProcessor from './pages/NikudProcessor';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NikudProcessor": NikudProcessor,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "NikudProcessor",
    Pages: PAGES,
    Layout: __Layout,
};