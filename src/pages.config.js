import NikudProcessor from './pages/NikudProcessor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NikudProcessor": NikudProcessor,
}

export const pagesConfig = {
    mainPage: "NikudProcessor",
    Pages: PAGES,
    Layout: __Layout,
};