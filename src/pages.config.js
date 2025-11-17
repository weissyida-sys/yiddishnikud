import NikudProcessor from './pages/NikudProcessor';
import ImprovementGuide from './pages/ImprovementGuide';
import __Layout from './Layout.jsx';


export const PAGES = {
    "NikudProcessor": NikudProcessor,
    "ImprovementGuide": ImprovementGuide,
}

export const pagesConfig = {
    mainPage: "NikudProcessor",
    Pages: PAGES,
    Layout: __Layout,
};